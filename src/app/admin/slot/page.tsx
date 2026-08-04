import { createClient } from "@/lib/supabase/server";
import { createSlot, deleteSlot, toggleSlotActive } from "@/lib/actions/admin";
import { formatTime } from "@/lib/dates";
import { AUDIENCE_LABEL, WEEKDAYS, type TrainingSlot } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";
import SlotForm from "@/components/admin/slot-form";

export const dynamic = "force-dynamic";

export default async function AdminSlotPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: slots } = await supabase
    .from("training_slots")
    .select("*")
    .order("event_date", { ascending: true, nullsFirst: true })
    .order("weekday")
    .order("start_time");

  const recurring = (slots ?? []).filter((s: TrainingSlot) => !s.event_date);
  const events = (slots ?? []).filter((s: TrainingSlot) => s.event_date);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Gestione slot</h1>
      <ErrorBanner message={searchParams.error} />

      <div className="mb-8">
        <h2 className="mb-2 font-semibold text-slate-700">Nuovo slot</h2>
        <SlotForm action={createSlot} />
      </div>

      {[
        { title: "Slot ricorrenti settimanali", list: recurring },
        { title: "Slot extra / eventi", list: events },
      ].map(({ title, list }) => (
        <section key={title} className="mb-8">
          <h2 className="mb-2 font-semibold text-slate-700">{title}</h2>
          {list.length === 0 && (
            <p className="text-sm text-slate-500">Nessuno slot.</p>
          )}
          <div className="space-y-2">
            {list.map((s: TrainingSlot) => (
              <div
                key={s.id}
                className={`card flex flex-wrap items-center justify-between gap-3 ${
                  s.is_active ? "" : "opacity-60"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {s.title} ·{" "}
                    {s.event_date
                      ? new Date(s.event_date + "T00:00:00").toLocaleDateString("it-IT")
                      : WEEKDAYS[s.weekday!]}{" "}
                    · {formatTime(s.start_time)}–{formatTime(s.end_time)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {AUDIENCE_LABEL[s.audience]} · posti {s.min_capacity}–{s.max_capacity}
                    {s.notes && ` · ${s.notes}`}
                    {!s.is_active && " · DISATTIVATO"}
                  </p>
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
        </section>
      ))}
    </div>
  );
}
