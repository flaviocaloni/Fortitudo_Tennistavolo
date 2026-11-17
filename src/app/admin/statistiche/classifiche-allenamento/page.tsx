import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { getCurrentSeason } from "@/lib/settings";
import PrintButton from "@/components/print-button";

export const dynamic = "force-dynamic";

type Tipo = "all" | "amatore" | "agonista";

interface PlayerRow {
  id: string;
  full_name: string;
  role: "amatore" | "agonista";
  weekly_limit: number;
}
interface BookingRow {
  user_id: string;
  slot_id: string;
  session_date: string;
  status: "active" | "cancelled";
  is_overbooking: boolean;
  selected_participants: number | null;
}
interface SlotRow {
  id: string;
  slot_type: "RECURRING" | "EVENT" | "PIZZA" | null;
  title: string;
  event_date: string | null;
  pizza_date: string | null;
  max_capacity: number | null;
}
type EventCategory = "Open day" | "Torneo" | "Pizzata" | "Altro evento";

function categoryOf(s: SlotRow): EventCategory {
  if (s.slot_type === "PIZZA") return "Pizzata";
  if (/open\s*day/i.test(s.title)) return "Open day";
  if (/torneo/i.test(s.title)) return "Torneo";
  return "Altro evento";
}

// Supabase restituisce al massimo 1000 righe per richiesta: pagina finché serve.
async function fetchAll<T>(
  make: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }>
): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let page = 0; ; page++) {
    const { data } = await make(page * size, page * size + size - 1);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  const d = new Date(from.slice(0, 7) + "-01T00:00:00");
  const end = to.slice(0, 7);
  while (d.toISOString().slice(0, 7) <= end) {
    months.push(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

export default async function ClassificheAllenamentoPage(props: {
  searchParams: Promise<{ from?: string; to?: string; tipo?: string; utenti?: string | string[] }>;
}) {
  const sp = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const db = createAdminClient() || supabase;
  const season = await getCurrentSeason(db);
  const today = new Date().toISOString().slice(0, 10);
  const from = sp.from || season?.start_date || today;
  const to = sp.to || season?.end_date || today;
  const tipo: Tipo = sp.tipo === "amatore" || sp.tipo === "agonista" ? sp.tipo : "all";
  const selectedIds = (
    Array.isArray(sp.utenti) ? sp.utenti : sp.utenti ? [sp.utenti] : []
  ).filter(Boolean);

  // Giocatori (amatori e agonisti) con il limite settimanale di prenotazioni
  const { data: profilesData } = await db
    .from("profiles")
    .select("id, full_name, role, weekly_limit")
    .in("role", ["amatore", "agonista"])
    .order("full_name");
  const allPlayers = (profilesData ?? []) as PlayerRow[];
  const pool = allPlayers.filter((p) => tipo === "all" || p.role === tipo);
  const population = selectedIds.length
    ? pool.filter((p) => selectedIds.includes(p.id))
    : pool;
  const popIds = new Set(population.map((p) => p.id));

  // Prenotazioni nel periodo, poi separate per tipo di slot
  const allBookings = await fetchAll<BookingRow>((a, b) =>
    db
      .from("bookings")
      .select("user_id, slot_id, session_date, status, is_overbooking, selected_participants")
      .gte("session_date", from)
      .lte("session_date", to)
      .order("id")
      .range(a, b)
  );
  const { data: slotsData } = await db
    .from("training_slots")
    .select("id, slot_type, title, event_date, pizza_date, max_capacity");
  const slots = (slotsData ?? []) as SlotRow[];
  const slotMap = new Map<string, SlotRow>(slots.map((s) => [s.id, s]));

  // Classifiche: solo allenamenti su slot ricorrenti
  const bookings = allBookings.filter((b) => slotMap.get(b.slot_id)?.slot_type === "RECURRING");
  // Eventi extra: open day, tornei, pizzate
  const eventBookings = allBookings.filter((b) => {
    const t = slotMap.get(b.slot_id)?.slot_type;
    return t === "EVENT" || t === "PIZZA";
  });

  // Settimane del periodo (minimo 1 per evitare divisioni per zero)
  const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1);
  const weeks = Math.max(1, days / 7);

  const rows = population.map((p) => {
    const mine = bookings.filter((b) => b.user_id === p.id);
    const active = mine.filter((b) => b.status === "active");
    const cancelled = mine.length - active.length;
    // Slot potenziali = limite settimanale × settimane del periodo (es. 3 × 2 = 6)
    const potential = Math.round(p.weekly_limit * weeks);
    return {
      id: p.id,
      name: p.full_name,
      role: p.role,
      weeklyLimit: p.weekly_limit,
      potential,
      active: active.length,
      cancelled,
      cancelRate: pct(cancelled, mine.length),
      overbooking: active.filter((b) => b.is_overbooking).length,
      perWeek: active.length / weeks,
      trainingPct: pct(active.length, potential),
    };
  });
  rows.sort((x, y) => (y.trainingPct ?? -1) - (x.trainingPct ?? -1) || x.name.localeCompare(y.name));

  // Serie mensile (allenamenti attivi) per il gruppo selezionato
  const months = monthsBetween(from, to);
  const monthly = months.map((m) => ({
    month: m,
    count: bookings.filter(
      (b) => b.status === "active" && popIds.has(b.user_id) && b.session_date.startsWith(m)
    ).length,
  }));
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.count));
  const maxActive = Math.max(1, ...rows.map((r) => r.active));

  // Totali
  const totalActive = rows.reduce((s, r) => s + r.active, 0);
  const totalPotential = rows.reduce((s, r) => s + r.potential, 0);
  const totalPct = pct(totalActive, totalPotential);

  // Eventi extra nel periodo (data evento/pizzata compresa tra from e to)
  const events = slots
    .filter((s) => s.slot_type === "EVENT" || s.slot_type === "PIZZA")
    .map((s) => ({ slot: s, date: (s.event_date ?? s.pizza_date ?? "") as string }))
    .filter((e) => e.date >= from && e.date <= to)
    .map(({ slot, date }) => {
      const eb = eventBookings.filter((b) => b.slot_id === slot.id);
      const active = eb.filter((b) => b.status === "active");
      const participants = active.reduce((n, b) => n + (b.selected_participants ?? 1), 0);
      const capacity = slot.max_capacity ?? null;
      return {
        id: slot.id,
        date,
        title: slot.title,
        category: categoryOf(slot),
        participants,
        capacity,
        fillPct: capacity ? pct(participants, capacity) : null,
        cancelled: eb.length - active.length,
        overbooking: active.filter((b) => b.is_overbooking).length,
      };
    })
    .sort((x, y) => x.date.localeCompare(y.date));

  const categories: EventCategory[] = ["Open day", "Torneo", "Pizzata", "Altro evento"];
  const categorySummary = categories
    .map((c) => {
      const list = events.filter((e) => e.category === c);
      const participants = list.reduce((n, e) => n + e.participants, 0);
      const fills = list.map((e) => e.fillPct).filter((f): f is number => f !== null);
      return {
        category: c,
        count: list.length,
        participants,
        avgParticipants: list.length ? Math.round(participants / list.length) : null,
        avgFill: fills.length ? Math.round(fills.reduce((s, f) => s + f, 0) / fills.length) : null,
      };
    })
    .filter((c) => c.count > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <style>{`@media print {
        nav, header, .no-print { display: none !important; }
        body { background: #fff !important; }
        .print-page { box-shadow: none !important; }
      }`}</style>

      <div className="mb-6">
        <Link href="/admin/statistiche" className="text-blue-600 hover:underline mb-4 inline-block no-print">
          ← Torna alle Statistiche
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Classifiche allenamento</h1>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">BETA</span>
        </div>
        <p className="text-gray-600 mt-1">
          Partecipazione agli allenamenti dal {from} al {to}
          {population.length === 1
            ? ` · ${population[0].full_name}`
            : selectedIds.length
              ? ` · ${population.length} utenti selezionati`
              : tipo === "all"
                ? " · tutti gli amatori e agonisti"
                : tipo === "amatore"
                  ? " · tutti gli amatori"
                  : " · tutti gli agonisti"}
        </p>
      </div>

      {/* Filtri (GET, funzionano senza JavaScript) */}
      <form method="get" className="no-print mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-white rounded-lg shadow p-4">
        <label className="flex flex-col text-sm text-gray-700">
          Data inizio
          <input type="date" name="from" defaultValue={from} className="input" />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Data fine
          <input type="date" name="to" defaultValue={to} className="input" />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Tipologia
          <select name="tipo" defaultValue={tipo} className="input">
            <option value="all">Amatori e agonisti</option>
            <option value="amatore">Solo amatori</option>
            <option value="agonista">Solo agonisti</option>
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Utenti (Ctrl/Cmd per più)
          <select name="utenti" multiple size={4} defaultValue={selectedIds} className="input">
            {pool.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.role})
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">Applica</button>
          <Link href="/admin/statistiche/classifiche-allenamento" className="btn">Reimposta</Link>
        </div>
      </form>

      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card label="Allenamenti effettuati" value={totalActive} />
        <Card label="Slot potenziali (100%)" value={totalPotential} />
        <Card label="% allenamento complessiva" value={totalPct === null ? "—" : `${totalPct}%`} />
      </div>

      {/* Andamento mensile */}
      <section className="print-page bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Andamento mensile allenamenti</h2>
        {monthly.length === 0 ? (
          <p className="text-gray-500">Nessun mese nel periodo selezionato.</p>
        ) : (
          <div className="flex items-end gap-2 h-56">
            {monthly.map((m) => (
              <div key={m.month} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end">
                <span className="text-xs text-gray-700 mb-1">{m.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count ? 2 : 0 }}
                  title={`${m.month}: ${m.count}`}
                />
                <span className="text-xs text-gray-500 mt-1">{m.month.slice(5)}/{m.month.slice(2, 4)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Classifica utenti */}
      <section className="print-page bg-white rounded-lg shadow p-6 mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Classifica partecipazione</h2>
        {rows.length === 0 ? (
          <p className="text-gray-500">Nessun utente selezionato.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-3">Utente</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3 text-right">Slot potenziali</th>
                <th className="py-2 pr-3 w-48">Allenamenti effettuati</th>
                <th className="py-2 pr-3 text-right">Annullate</th>
                <th className="py-2 pr-3 text-right">% annullate</th>
                <th className="py-2 pr-3 text-right">Overbooking</th>
                <th className="py-2 pr-3 text-right">Media/sett.</th>
                <th className="py-2 text-right">% allenamento</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium text-gray-900">{r.name}</td>
                  <td className="py-2 pr-3 capitalize text-gray-600">{r.role}</td>
                  <td className="py-2 pr-3 text-right">{r.potential}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-blue-500 rounded" style={{ width: `${(r.active / maxActive) * 100}%`, minWidth: r.active ? 4 : 0 }} />
                      <span>{r.active}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right">{r.cancelled}</td>
                  <td className="py-2 pr-3 text-right">{r.cancelRate === null ? "—" : `${r.cancelRate}%`}</td>
                  <td className="py-2 pr-3 text-right">{r.overbooking}</td>
                  <td className="py-2 pr-3 text-right">{r.perWeek.toFixed(1)}</td>
                  <td className="py-2 text-right font-semibold">{r.trainingPct === null ? "—" : `${r.trainingPct}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Eventi extra */}
      <section className="print-page bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Eventi extra: open day, tornei, pizzate</h2>
        {categorySummary.length === 0 ? (
          <p className="text-gray-500">Nessun evento extra nel periodo selezionato.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {categorySummary.map((c) => (
                <div key={c.category} className="rounded border p-3">
                  <div className="text-sm font-semibold text-gray-900">{c.category}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {c.count} evento/i · {c.participants} partecipanti
                  </div>
                  <div className="text-xs text-gray-600">
                    Media {c.avgParticipants ?? "—"} per evento · riempimento {c.avgFill === null ? "—" : `${c.avgFill}%`}
                  </div>
                </div>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Evento</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3 text-right">Partecipanti</th>
                  <th className="py-2 pr-3 text-right">Capacità</th>
                  <th className="py-2 pr-3 text-right">% riempimento</th>
                  <th className="py-2 pr-3 text-right">Annullate</th>
                  <th className="py-2 text-right">Overbooking</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{e.date}</td>
                    <td className="py-2 pr-3 font-medium text-gray-900">{e.title}</td>
                    <td className="py-2 pr-3 text-gray-600">{e.category}</td>
                    <td className="py-2 pr-3 text-right">{e.participants}</td>
                    <td className="py-2 pr-3 text-right">{e.capacity ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{e.fillPct === null ? "—" : `${e.fillPct}%`}</td>
                    <td className="py-2 pr-3 text-right">{e.cancelled}</td>
                    <td className="py-2 text-right">{e.overbooking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="text-xs text-gray-500 bg-white rounded-lg p-4">
        <p className="font-semibold text-gray-700 mb-1">Note (beta)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Le classifiche considerano solo le prenotazioni su slot ricorrenti (allenamenti). Eventi extra, open day, tornei e pizzate sono esclusi.</li>
          <li>Categoria evento: pizzata = slot di tipo PIZZA; open day e torneo riconosciuti dal titolo dello slot; il resto è &quot;Altro evento&quot;.</li>
          <li>Partecipanti: per le pizzate conta il numero di persone scelto in prenotazione; per gli altri eventi, una prenotazione = un partecipante.</li>
          <li>Slot potenziali = limite settimanale dell&apos;utente × settimane del periodo (es. 3 slot/settimana × 2 settimane = 6).</li>
          <li>Allenamenti effettuati = prenotazioni attive con data sessione nel periodo. Le annullate sono escluse dal conteggio.</li>
          <li>% allenamento = allenamenti effettuati / slot potenziali. Può superare il 100% per overbooking.</li>
          <li>Media/sett. = allenamenti effettuati / settimane del periodo.</li>
        </ul>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}
