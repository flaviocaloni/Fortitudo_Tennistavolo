import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { getCurrentSeason } from "@/lib/settings";
import { fetchAll, pct } from "@/lib/statistiche/helpers";
import PrintButton from "@/components/print-button";

export const dynamic = "force-dynamic";

interface BookingRow {
  slot_id: string;
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

export default async function EventiExtraPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const db = createAdminClient() || supabase;
  const season = await getCurrentSeason(db);
  const today = new Date().toISOString().slice(0, 10);
  const from = sp.from || season?.start_date || today;
  const to = sp.to || season?.end_date || today;

  const { data: slotsData } = await db
    .from("training_slots")
    .select("id, slot_type, title, event_date, pizza_date, max_capacity");
  const slots = (slotsData ?? []) as SlotRow[];
  const eventSlots = slots.filter((s) => s.slot_type === "EVENT" || s.slot_type === "PIZZA");
  const eventIds = new Set(eventSlots.map((s) => s.id));

  const bookings = (
    await fetchAll<BookingRow & { session_date: string }>((a, b) =>
      db
        .from("bookings")
        .select("slot_id, session_date, status, is_overbooking, selected_participants")
        .gte("session_date", from)
        .lte("session_date", to)
        .order("id")
        .range(a, b)
    )
  ).filter((b) => eventIds.has(b.slot_id));

  const events = eventSlots
    .map((s) => ({ slot: s, date: (s.event_date ?? s.pizza_date ?? "") as string }))
    .filter((e) => e.date >= from && e.date <= to)
    .map(({ slot, date }) => {
      const eb = bookings.filter((b) => b.slot_id === slot.id);
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
          <h1 className="text-3xl font-bold text-gray-900">Eventi extra</h1>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">BETA</span>
        </div>
        <p className="text-gray-600 mt-1">Open day, tornei e pizzate dal {from} al {to}</p>
      </div>

      <form method="get" className="no-print mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-white rounded-lg shadow p-4">
        <label className="flex flex-col text-sm text-gray-700">
          Data inizio
          <input type="date" name="from" defaultValue={from} className="input" />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Data fine
          <input type="date" name="to" defaultValue={to} className="input" />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">Applica</button>
          <Link href="/admin/statistiche/eventi-extra" className="btn">Reimposta</Link>
        </div>
      </form>

      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <section className="print-page bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Riepilogo per categoria</h2>
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
          <li>Categoria evento: pizzata = slot di tipo PIZZA; open day e torneo riconosciuti dal titolo dello slot; il resto è &quot;Altro evento&quot;.</li>
          <li>Partecipanti: per le pizzate conta il numero di persone scelto in prenotazione; per gli altri eventi, una prenotazione = un partecipante.</li>
          <li>Riempimento = partecipanti / capacità dello slot (campo max_capacity).</li>
        </ul>
      </section>
    </div>
  );
}
