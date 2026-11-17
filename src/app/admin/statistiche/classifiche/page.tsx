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
}
interface BookingRow {
  user_id: string;
  session_date: string;
  status: "active" | "cancelled";
  is_overbooking: boolean;
}
interface ConvocationRow {
  user_id: string;
  championship_matches: { scheduled_start_at: string } | null;
}
interface AttendanceRow {
  user_id: string;
  status: "PRESENT" | "ABSENT";
  championship_matches: { scheduled_start_at: string } | null;
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

export default async function ClassifichePage(props: {
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
  const toEnd = `${to}T23:59:59`;

  // Giocatori (amatori e agonisti)
  const { data: profilesData } = await db
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["amatore", "agonista"])
    .order("full_name");
  const allPlayers = (profilesData ?? []) as PlayerRow[];
  const pool = allPlayers.filter((p) => tipo === "all" || p.role === tipo);
  const population = selectedIds.length
    ? pool.filter((p) => selectedIds.includes(p.id))
    : pool;
  const popIds = new Set(population.map((p) => p.id));

  // Prenotazioni allenamento nel periodo
  const bookings = await fetchAll<BookingRow>((a, b) =>
    db
      .from("bookings")
      .select("user_id, session_date, status, is_overbooking")
      .gte("session_date", from)
      .lte("session_date", to)
      .order("id")
      .range(a, b)
  );

  // Convocazioni e disponibilità agonisti (partite nel periodo)
  const convocations = await fetchAll<ConvocationRow>((a, b) =>
    db
      .from("championship_match_convocations")
      .select("user_id, championship_matches!inner(scheduled_start_at)")
      .gte("championship_matches.scheduled_start_at", from)
      .lte("championship_matches.scheduled_start_at", toEnd)
      .order("id")
      .range(a, b)
  );
  const attendances = await fetchAll<AttendanceRow>((a, b) =>
    db
      .from("championship_match_attendances")
      .select("user_id, status, championship_matches!inner(scheduled_start_at)")
      .gte("championship_matches.scheduled_start_at", from)
      .lte("championship_matches.scheduled_start_at", toEnd)
      .order("id")
      .range(a, b)
  );

  // Aggregazione per utente
  const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1);
  const weeks = Math.max(1, days / 7);

  const rows = population.map((p) => {
    const mine = bookings.filter((b) => b.user_id === p.id);
    const active = mine.filter((b) => b.status === "active");
    const cancelled = mine.length - active.length;
    const conv = convocations.filter((c) => c.user_id === p.id).length;
    const att = attendances.filter((a) => a.user_id === p.id);
    const present = att.filter((a) => a.status === "PRESENT").length;
    const absent = att.length - present;
    return {
      id: p.id,
      name: p.full_name,
      role: p.role,
      active: active.length,
      cancelled,
      cancelRate: pct(cancelled, mine.length),
      overbooking: active.filter((b) => b.is_overbooking).length,
      perWeek: active.length / weeks,
      convocations: conv,
      present,
      absent,
      availability: pct(present, present + absent),
    };
  });
  rows.sort((x, y) => y.active - x.active || x.name.localeCompare(y.name));

  // Serie mensile (prenotazioni attive) per il gruppo selezionato
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
  const totalConv = rows.reduce((s, r) => s + r.convocations, 0);
  const totalPresent = rows.reduce((s, r) => s + r.present, 0);
  const totalAbsent = rows.reduce((s, r) => s + r.absent, 0);
  const agonistRows = rows.filter((r) => r.role === "agonista");
  const avgAvail = pct(totalPresent, totalPresent + totalAbsent);
  const avgPerWeekAmatori = rows.filter((r) => r.role === "amatore").length
    ? rows.filter((r) => r.role === "amatore").reduce((s, r) => s + r.perWeek, 0) /
      rows.filter((r) => r.role === "amatore").length
    : null;

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
          <h1 className="text-3xl font-bold text-gray-900">Classifiche</h1>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">BETA</span>
        </div>
        <p className="text-gray-600 mt-1">
          Partecipazione agli allenamenti e disponibilità alle partite, dal {from} al {to}
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
          <Link href="/admin/statistiche/classifiche" className="btn">Reimposta</Link>
        </div>
      </form>

      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card label="Prenotazioni attive" value={totalActive} />
        <Card label="Media a settimana (amatori)" value={avgPerWeekAmatori === null ? "—" : avgPerWeekAmatori.toFixed(1)} />
        <Card label="Convocazioni" value={totalConv} />
        <Card label="Disponibilità agonisti" value={avgAvail === null ? "—" : `${avgAvail}%`} />
      </div>

      {/* Andamento mensile */}
      <section className="print-page bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Andamento mensile prenotazioni attive</h2>
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
                <th className="py-2 pr-3 w-48">Prenotazioni attive</th>
                <th className="py-2 pr-3 text-right">Annullate</th>
                <th className="py-2 pr-3 text-right">% annullate</th>
                <th className="py-2 pr-3 text-right">Overbooking</th>
                <th className="py-2 pr-3 text-right">Media/sett.</th>
                <th className="py-2 pr-3 text-right">Convocazioni</th>
                <th className="py-2 pr-3 text-right">Disponibile</th>
                <th className="py-2 pr-3 text-right">Non disp.</th>
                <th className="py-2 text-right">% disponibilità</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium text-gray-900">{r.name}</td>
                  <td className="py-2 pr-3 capitalize text-gray-600">{r.role}</td>
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
                  <td className="py-2 pr-3 text-right">{r.role === "agonista" ? r.convocations : "—"}</td>
                  <td className="py-2 pr-3 text-right">{r.role === "agonista" ? r.present : "—"}</td>
                  <td className="py-2 pr-3 text-right">{r.role === "agonista" ? r.absent : "—"}</td>
                  <td className="py-2 text-right">
                    {r.role === "agonista" ? (r.availability === null ? "—" : `${r.availability}%`) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {agonistRows.length > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            Disponibilità = risposte &quot;presente&quot; / (presente + assente) sulle partite del periodo. Le partite senza risposta non sono conteggiate.
          </p>
        )}
      </section>

      <section className="text-xs text-gray-500 bg-white rounded-lg p-4">
        <p className="font-semibold text-gray-700 mb-1">Note (beta)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Prenotazioni attive: prenotazioni non annullate con data sessione nel periodo. Le annullate sono conteggiate a parte.</li>
          <li>Media a settimana = prenotazioni attive / settimane del periodo (minimo 1).</li>
          <li>Convocazioni e disponibilità derivano dalle partite di campionato con data di inizio nel periodo.</li>
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
