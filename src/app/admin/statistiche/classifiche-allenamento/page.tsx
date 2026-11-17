import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { getCurrentSeason } from "@/lib/settings";
import { fetchAll, pct } from "@/lib/statistiche/helpers";
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
}
interface SlotRow {
  id: string;
  slot_type: "RECURRING" | "EVENT" | "PIZZA" | null;
}
interface RowData {
  id: string;
  name: string;
  role: "amatore" | "agonista";
  weeklyLimit: number;
  potential: number;
  active: number;
  cancelled: number;
  cancelRate: number | null;
  overbooking: number;
  perWeek: number;
  trainingPct: number | null;
}

type SortKey = keyof RowData;
const SORT_KEYS: SortKey[] = [
  "name",
  "role",
  "potential",
  "active",
  "cancelled",
  "cancelRate",
  "overbooking",
  "perWeek",
  "trainingPct",
];
const TEXT_KEYS: SortKey[] = ["name", "role"];

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

export default async function ClassificheAllenamentoPage(props: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    tipo?: string;
    utenti?: string | string[];
    ord?: string;
    dir?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const db = createAdminClient() || supabase;
  const season = await getCurrentSeason(db);
  const today = new Date().toISOString().slice(0, 10);
  // Default: dall'inizio del campionato in corso (stagione corrente) a oggi
  const from = sp.from || season?.start_date || today;
  const to = sp.to || today;
  const tipo: Tipo = sp.tipo === "amatore" || sp.tipo === "agonista" ? sp.tipo : "all";
  const selectedIds = (
    Array.isArray(sp.utenti) ? sp.utenti : sp.utenti ? [sp.utenti] : []
  ).filter(Boolean);

  // Ordinamento: colonna e direzione dalla URL (default: % allenamento decrescente)
  const sortKey: SortKey = SORT_KEYS.includes(sp.ord as SortKey) ? (sp.ord as SortKey) : "trainingPct";
  const sortDir: "asc" | "desc" = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : "desc";

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
  const { data: slotsData } = await db.from("training_slots").select("id, slot_type");
  const slots = (slotsData ?? []) as SlotRow[];
  const recurringIds = new Set(slots.filter((s) => s.slot_type === "RECURRING").map((s) => s.id));

  // Classifiche: solo allenamenti su slot ricorrenti
  const bookings = allBookings.filter((b) => recurringIds.has(b.slot_id));

  // Settimane del periodo (minimo 1 per evitare divisioni per zero)
  const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1);
  const weeks = Math.max(1, days / 7);

  const rows: RowData[] = population.map((p) => {
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

  // Ordine: colonna scelta (valori vuoti sempre in fondo), poi allenamenti, tipologia e utente
  const compareCol = (x: RowData, y: RowData): number => {
    const a = x[sortKey];
    const b = y[sortKey];
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    const c = TEXT_KEYS.includes(sortKey)
      ? String(a).localeCompare(String(b))
      : (a as number) - (b as number);
    return sortDir === "asc" ? c : -c;
  };
  rows.sort(
    (x, y) =>
      compareCol(x, y) ||
      y.active - x.active ||
      x.role.localeCompare(y.role) ||
      x.name.localeCompare(y.name)
  );

  // Semaforo: rosso < 50%, giallo 50–79%, verde ≥ 80%
  const trafficLight = (p: number | null) =>
    p === null
      ? "bg-gray-100 text-gray-500"
      : p >= 80
        ? "bg-green-100 text-green-800"
        : p >= 50
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-800";

  // Distribuzione utenti per fascia di % allenamento (segue i filtri attivi)
  const buckets = [
    { label: "Sotto 50%", bar: "bg-red-500", test: (p: number) => p < 50 },
    { label: "50–79%", bar: "bg-amber-400", test: (p: number) => p >= 50 && p < 80 },
    { label: "80–99%", bar: "bg-green-500", test: (p: number) => p >= 80 && p < 100 },
    { label: "100% e oltre", bar: "bg-emerald-700", test: (p: number) => p >= 100 },
  ];
  const withPct = rows.filter((r) => r.trainingPct !== null);
  const distribution = buckets.map((b) => ({
    ...b,
    count: withPct.filter((r) => b.test(r.trainingPct as number)).length,
  }));
  const maxDist = Math.max(1, ...distribution.map((d) => d.count));
  const noPotential = rows.length - withPct.length;

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

  // Link di ordinamento: mantiene periodo, tipologia e utenti selezionati
  const buildHref = (params: Record<string, string>) => {
    const q = new URLSearchParams();
    q.set("from", from);
    q.set("to", to);
    if (tipo !== "all") q.set("tipo", tipo);
    for (const id of selectedIds) q.append("utenti", id);
    for (const [k, v] of Object.entries(params)) q.set(k, v);
    return `/admin/statistiche/classifiche-allenamento?${q.toString()}`;
  };
  const sortHref = (key: SortKey) => {
    const nextDir =
      sortKey === key
        ? sortDir === "desc" ? "asc" : "desc"
        : TEXT_KEYS.includes(key) ? "asc" : "desc";
    return buildHref({ ord: key, dir: nextDir });
  };
  const Th = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => {
    const active = sortKey === k;
    return (
      <th className={`py-2 pr-3 ${right ? "text-right" : ""}`}>
        <Link
          href={sortHref(k)}
          className={`inline-flex items-center gap-1 hover:text-gray-900 ${active ? "text-gray-900 font-semibold" : ""}`}
        >
          {label}
          <span className="text-xs">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
        </Link>
      </th>
    );
  };

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
        <input type="hidden" name="ord" value={sortKey} />
        <input type="hidden" name="dir" value={sortDir} />
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

      {/* Distribuzione % allenamento */}
      <section className="print-page bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Distribuzione % allenamento</h2>
        <p className="text-xs text-gray-500 mb-4">
          Numero di utenti per fascia di % allenamento, sul gruppo e periodo selezionati.
          {noPotential > 0 ? ` ${noPotential} utente/i senza slot potenziali esclusi.` : ""}
        </p>
        {withPct.length === 0 ? (
          <p className="text-gray-500">Nessun utente con slot potenziali nel periodo.</p>
        ) : (
          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.label} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="text-gray-700">{d.label}</span>
                <div className="h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full ${d.bar} rounded`}
                    style={{ width: `${(d.count / maxDist) * 100}%`, minWidth: d.count ? 4 : 0 }}
                    title={`${d.label}: ${d.count} utenti`}
                  />
                </div>
                <span className="text-right font-semibold text-gray-900">{d.count}</span>
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
                <Th k="name" label="Utente" />
                <Th k="role" label="Tipo" />
                <Th k="potential" label="Slot potenziali" right />
                <Th k="active" label="Allenamenti effettuati" />
                <Th k="cancelled" label="Annullate" right />
                <Th k="cancelRate" label="% annullate" right />
                <Th k="overbooking" label="Overbooking" right />
                <Th k="perWeek" label="Media/sett." right />
                <Th k="trainingPct" label="% allenamento" right />
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
                  <td className="py-2 text-right">
                    <span className={`inline-block min-w-[3.5rem] rounded px-2 py-0.5 text-center font-semibold ${trafficLight(r.trainingPct)}`}>
                      {r.trainingPct === null ? "—" : `${r.trainingPct}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="text-xs text-gray-500 bg-white rounded-lg p-4">
        <p className="font-semibold text-gray-700 mb-1">Note (beta)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Le classifiche considerano solo le prenotazioni su slot ricorrenti (allenamenti). Gli eventi extra sono nella pagina Eventi extra.</li>
          <li>Slot potenziali = limite settimanale dell&apos;utente × settimane del periodo (es. 3 slot/settimana × 2 settimane = 6).</li>
          <li>Allenamenti effettuati = prenotazioni attive con data sessione nel periodo. Le annullate sono escluse dal conteggio.</li>
          <li>% allenamento = allenamenti effettuati / slot potenziali. Può superare il 100% per overbooking.</li>
          <li>Media/sett. = allenamenti effettuati / settimane del periodo.</li>
          <li>Clicca un&apos;intestazione di colonna per ordinare; un secondo clic inverte l&apos;ordine.</li>
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
