import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/dates";
import { AUDIENCE_LABEL, type TrainingSlot } from "@/lib/types";
import { deleteSlot, toggleSlotActive, updateSlot } from "@/lib/actions/admin";
import Link from "next/link";
import SlotEditToggle from "@/components/admin/slot-edit-toggle";
import EventsFilterClient from "@/components/admin/events-filter-client";

export const dynamic = "force-dynamic";

export default async function EventsPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const [{ data: slots }, { data: seasons }] = await Promise.all([
    supabase
      .from("training_slots")
      .select("*")
      .not("event_date", "is", null)
      .order("event_date", { ascending: true }),
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
  ]);

  const events = (slots ?? []) as TrainingSlot[];
  const seasonNameById = new Map((seasons ?? []).map((s) => [s.id, s.name]));
  const filter = (searchParams.filter ?? "future") as "all" | "future" | "past";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = events.filter((e) => {
    const eventDate = new Date(e.event_date + "T00:00:00");
    if (filter === "future") return eventDate >= today;
    if (filter === "past") return eventDate < today;
    return true;
  });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">Slot extra / eventi</h1>
      <p className="mb-6 text-slate-600">
        Gestisci gli eventi speciali e le sessioni straordinarie.
      </p>

      <EventsFilterClient currentFilter={filter} />

      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">Nessun evento in questa categoria.</p>
      )}

      <div className="space-y-2">
        {filtered.map((e: TrainingSlot) => (
          <div
            key={e.id}
            className={`card flex flex-wrap items-center justify-between gap-3 ${
              e.is_active ? "" : "opacity-60"
            }`}
          >
            <div>
              <p className="font-medium">
                {e.title} ·{" "}
                {new Date(e.event_date! + "T00:00:00").toLocaleDateString("it-IT")} ·{" "}
                {formatTime(e.start_time)}–{formatTime(e.end_time)}
              </p>
              <p className="text-sm text-slate-600">
                Destinatari: {AUDIENCE_LABEL[e.audience]} · Posti: min {e.min_capacity} – max{" "}
                {e.max_capacity} · Stagione: {seasonNameById.get(e.season_id) ?? "—"} · Stato:{" "}
                {e.is_active ? "Attivo" : "DISATTIVATO"}
              </p>
              {e.sede_evento && (
                <p className="text-sm text-slate-600">Sede: {e.sede_evento}</p>
              )}
              {e.url && (
                <p className="text-sm text-slate-600">
                  URL:{" "}
                  <Link href={e.url} target="_blank" className="text-blue-600 hover:underline">
                    {e.url}
                  </Link>
                </p>
              )}
              {e.notes && <p className="text-sm text-slate-600">Note: {e.notes}</p>}
              <p className="text-xs text-slate-400">ID: {e.id}</p>
              <SlotEditToggle slot={e} action={updateSlot} seasons={seasons ?? []} />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <Link href={`/admin/slot/eventi/${e.id}/clone`} className="btn-ghost flex-shrink-0">
                🔄 Clona
              </Link>
              <form action={toggleSlotActive} className="flex-shrink-0">
                <input type="hidden" name="slot_id" value={e.id} />
                <input type="hidden" name="is_active" value={String(!e.is_active)} />
                <button className="btn-ghost">
                  {e.is_active ? "Disattiva" : "Riattiva"}
                </button>
              </form>
              <form action={deleteSlot} className="flex-shrink-0">
                <input type="hidden" name="slot_id" value={e.id} />
                <button className="btn-danger">Elimina</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
