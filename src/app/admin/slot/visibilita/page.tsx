import { createClient } from "@/lib/supabase/server";
import { updateCalendarDays } from "@/lib/actions/admin";
import { getCalendarDaysAhead } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function VisibilityPage() {
  const supabase = await createClient();
  const calendarDays = await getCalendarDaysAhead(supabase);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Visibilità calendario</h1>
      <p className="mb-6 text-slate-600">
        Configura quanti giorni in avanti gli utenti possono visualizzare e prenotare slot nel calendario.
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

      <div className="card mt-6 bg-slate-50">
        <h2 className="mb-2 font-semibold">ℹ️ Informazioni</h2>
        <p className="text-sm text-slate-600">
          Con questa impostazione, gli utenti possono prenotare fino a <strong>{calendarDays} giorni</strong> da oggi.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Ad esempio, se imposti a 30, un utente che accede oggi vedrà allenamenti fino al {new Date(Date.now() + calendarDays * 24 * 60 * 60 * 1000).toLocaleDateString("it-IT")}.
        </p>
      </div>
    </div>
  );
}
