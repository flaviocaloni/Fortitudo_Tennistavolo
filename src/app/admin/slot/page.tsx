import { createClient } from "@/lib/supabase/server";
import {
  createClosure,
  createSlot,
  deleteClosure,
  deleteSlot,
  toggleSlotActive,
  updateCalendarDays,
} from "@/lib/actions/admin";
import { getCalendarDaysAhead } from "@/lib/settings";
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
  const [{ data: slots }, { data: closures }] = await Promise.all([
    supabase
      .from("training_slots")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: true })
      .order("weekday")
      .order("start_time"),
    supabase.from("club_closures").select("*").order("start_date"),
  ]);
  const calendarDays = await getCalendarDaysAhead(supabase);

  const recurring = (slots ?? []).filter((s: TrainingSlot) => !s.event_date);
  const events = (slots ?? []).filter((s: TrainingSlot) => s.event_date);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Gestione slot</h1>
      <ErrorBanner message={searchParams.error} />

      <form
        action={updateCalendarDays}
        className="card mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="label">Visibilità calendario (giorni)</label>
          <input
            name="days"
            type="number"
            min={1}
            max={365}
            defaultValue={calendarDays}
            required
            className="input w-32"
          />
        </div>
        <button className="btn-navy">Salva</button>
        <p className="text-xs text-slate-500">
          Gli utenti vedono e possono prenotare gli allenamenti fino a{" "}
          {calendarDays} giorni da oggi.
        </p>
      </form>

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

      <section className="mb-8">
        <h2 className="mb-2 font-semibold text-slate-700">
          Chiusure del centro
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Nei giorni di chiusura il calendario è bloccato e le prenotazioni
          vengono rifiutate.
        </p>
        <form
          action={createClosure}
          className="card mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="label">Dal</label>
            <input name="start_date" type="date" required className="input" />
          </div>
          <div>
            <label className="label">Al (vuoto = solo un giorno)</label>
            <input name="end_date" type="date" className="input" />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input name="reason" className="input" placeholder="es. Chiusura natalizia" />
          </div>
          <div className="flex items-end">
            <button className="btn-navy">Aggiungi chiusura</button>
          </div>
        </form>
        {(closures ?? []).length === 0 && (
          <p className="text-sm text-slate-500">
            Nessuna chiusura definita (se hai già eseguito la migration 0003,
            qui compariranno le chiusure della stagione).
          </p>
        )}
        <div className="space-y-2">
          {(closures ?? []).map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">
                  {new Date(c.start_date + "T00:00:00").toLocaleDateString("it-IT")}
                  {c.end_date !== c.start_date &&
                    " → " +
                      new Date(c.end_date + "T00:00:00").toLocaleDateString("it-IT")}
                </span>{" "}
                · {c.reason}
              </p>
              <form action={deleteClosure}>
                <input type="hidden" name="closure_id" value={c.id} />
                <button className="btn-danger">Elimina</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
