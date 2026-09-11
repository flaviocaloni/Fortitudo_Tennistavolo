import { createClient } from "@/lib/supabase/server";
import { createSlot, updateCalendarDays } from "@/lib/actions/admin";
import { getCurrentSeason, getCalendarDaysAhead } from "@/lib/settings";
import SlotForm from "@/components/admin/slot-form";

export const dynamic = "force-dynamic";

export default async function NewSlotPage() {
  const supabase = await createClient();
  const [{ data: seasons }, currentSeason, calendarDays] = await Promise.all([
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
    getCurrentSeason(supabase),
    getCalendarDaysAhead(supabase),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Nuovo slot</h1>
      <p className="mb-6 text-slate-600">
        Crea un nuovo allenamento ricorrente o un evento speciale.
      </p>

      <SlotForm action={createSlot} seasons={seasons ?? []} currentSeasonId={currentSeason?.id} />

      <div className="mt-8 border-t pt-8">
        <h2 className="mb-2 font-semibold text-slate-700">Visibilità calendario</h2>
        <p className="mb-4 text-sm text-slate-600">
          Configura quanti giorni in avanti gli utenti possono visualizzare e prenotare nel calendario.
        </p>

        <form
          action={updateCalendarDays}
          className="card flex flex-col gap-4"
        >
          <div>
            <label className="label">Giorni visibili in anticipo</label>
            <input
              name="days"
              type="number"
              min={1}
              max={365}
              defaultValue={calendarDays}
              required
              className="input w-full max-w-xs"
            />
          </div>
          <button className="btn-navy w-fit">Salva</button>
        </form>

        <div className="card mt-4 bg-slate-50">
          <p className="text-xs text-slate-600">
            Attualmente: gli utenti vedono slot fino a <strong>{calendarDays} giorni</strong> da oggi.
          </p>
        </div>
      </div>
    </div>
  );
}
