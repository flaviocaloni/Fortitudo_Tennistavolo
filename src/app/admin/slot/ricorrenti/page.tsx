import { createClient } from "@/lib/supabase/server";
import {
  deleteSlot,
  toggleSlotActive,
  updateSlot,
} from "@/lib/actions/admin";
import { formatTime } from "@/lib/dates";
import { AUDIENCE_LABEL, WEEKDAYS, type TrainingSlot } from "@/lib/types";
import SlotEditToggle from "@/components/admin/slot-edit-toggle";

export const dynamic = "force-dynamic";

export default async function RecurringSlotPage() {
  const supabase = await createClient();
  const [{ data: slots }, { data: seasons }] = await Promise.all([
    supabase
      .from("training_slots")
      .select("*")
      .is("event_date", null)
      .order("weekday")
      .order("start_time"),
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
  ]);

  const slots_data = (slots ?? []) as TrainingSlot[];
  const seasonNameById = new Map((seasons ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">Slot ricorrenti settimanali</h1>
      <p className="mb-6 text-slate-600">
        Gestisci gli allenamenti ricorrenti che si ripetono ogni settimana.
      </p>

      {slots_data.length === 0 && (
        <p className="text-sm text-slate-500">Nessuno slot ricorrente.</p>
      )}

      <div className="space-y-2">
        {slots_data.map((s: TrainingSlot) => (
          <div
            key={s.id}
            className={`card flex flex-wrap items-center justify-between gap-3 ${
              s.is_active ? "" : "opacity-60"
            }`}
          >
            <div>
              <p className="font-medium">
                {s.title} · {WEEKDAYS[s.weekday!]} · {formatTime(s.start_time)}–
                {formatTime(s.end_time)}
              </p>
              <p className="text-sm text-slate-600">
                Destinatari: {AUDIENCE_LABEL[s.audience]} · Posti: min {s.min_capacity} – max{" "}
                {s.max_capacity} · Stagione: {seasonNameById.get(s.season_id) ?? "—"} · Stato:{" "}
                {s.is_active ? "Attivo" : "DISATTIVATO"}
                {s.start_date && s.end_date && (
                  <>
                    {" · "}
                    Periodo:{" "}
                    {new Date(s.start_date + "T00:00:00").toLocaleDateString("it-IT")} →{" "}
                    {new Date(s.end_date + "T00:00:00").toLocaleDateString("it-IT")}
                  </>
                )}
              </p>
              {s.notes && <p className="text-sm text-slate-600">Note: {s.notes}</p>}
              <p className="text-xs text-slate-400">ID: {s.id}</p>
              <SlotEditToggle slot={s} action={updateSlot} seasons={seasons ?? []} />
            </div>
            <div className="flex gap-2">
              <form action={toggleSlotActive}>
                <input type="hidden" name="slot_id" value={s.id} />
                <input type="hidden" name="is_active" value={String(!s.is_active)} />
                <button className="btn-ghost">
                  {s.is_active ? "Disattiva" : "Riattiva"}
                </button>
              </form>
              <form action={deleteSlot}>
                <input type="hidden" name="slot_id" value={s.id} />
                <button className="btn-danger">Elimina</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
