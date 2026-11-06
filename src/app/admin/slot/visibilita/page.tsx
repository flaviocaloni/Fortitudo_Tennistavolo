import { createClient } from "@/lib/supabase/server";
import { updateCalendarVisibility } from "@/lib/actions/admin";
import { getCalendarVisibility, getCurrentSeason } from "@/lib/settings";
import { formatDateIT, recurringCutoffDate, toISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function VisibilityPage() {
  const supabase = await createClient();
  const visibility = await getCalendarVisibility(supabase);
  const season = await getCurrentSeason(supabase);

  const today = toISODate(new Date());
  const windowStart = season && today < season.start_date ? season.start_date : today;
  const cutoffDate = recurringCutoffDate(visibility.mode, visibility.days, today, windowStart);
  const isWeekMode = visibility.mode === "NEXT_WEEK_FROM_SATURDAY";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Visibilità calendario</h1>
      <p className="mb-6 text-slate-600">
        Scegli come gli utenti vedono gli slot ricorrenti (allenamenti) nel calendario. Una sola modalità è attiva alla volta.
      </p>

      <form action={updateCalendarVisibility} className="card flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="label mb-2">Modalità di visibilità</legend>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="DAYS"
              defaultChecked={!isWeekMode}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-slate-800">Giorni di anticipo</span>
              <span className="block text-sm text-slate-600">
                Gli slot sono visibili per un numero fisso di giorni a partire da oggi (impostazione sotto).
                Lo slot compare appena rientra in questa finestra, indipendentemente dal giorno della settimana.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="NEXT_WEEK_FROM_SATURDAY"
              defaultChecked={isWeekMode}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-slate-800">Settimana successiva dal sabato</span>
              <span className="block text-sm text-slate-600">
                Gli slot della settimana successiva (da lunedì a domenica) diventano visibili dal sabato della
                settimana precedente. Esempio: il calendario del 9–15 novembre si apre sabato 7 novembre.
                Non serve il numero di giorni.
              </span>
            </span>
          </label>
        </fieldset>

        <div>
          <label className="label">Giorni di anticipo</label>
          <input
            name="days"
            type="number"
            min={1}
            max={365}
            defaultValue={visibility.days}
            required
            className="input w-full max-w-xs"
          />
          <p className="mt-1 text-xs text-slate-500">
            Usato solo con la modalità &quot;Giorni di anticipo&quot;. Il valore viene salvato anche se è attiva l&apos;altra modalità.
          </p>
        </div>

        <button className="btn-navy w-fit">Salva</button>
      </form>

      <div className="card mt-6 bg-slate-50">
        <h2 className="mb-2 font-semibold">ℹ️ Informazioni</h2>

        <p className="text-sm text-slate-600">
          Modalità attiva: <strong>{isWeekMode ? "Settimana successiva dal sabato" : "Giorni di anticipo"}</strong>.
        </p>

        <p className="mt-2 text-sm text-slate-600">
          Oggi è {formatDateIT(today)}. Con la modalità attiva gli utenti vedono gli slot ricorrenti fino al{" "}
          <strong>{formatDateIT(cutoffDate)}</strong>.
        </p>

        {isWeekMode ? (
          <p className="mt-2 text-sm text-slate-600">
            Fino a sabato compreso il calendario mostra solo la settimana in corso. Dal sabato si apre anche
            la settimana successiva, fino alla sua domenica.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Con {visibility.days} giorni, un utente che accede oggi vede gli slot fino a{" "}
            {formatDateIT(cutoffDate)}. Ogni giorno la finestra si sposta in avanti.
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Gli eventi extra futuri e le serate pizza restano sempre visibili, indipendentemente da questa impostazione.
        </p>
      </div>
    </div>
  );
}
