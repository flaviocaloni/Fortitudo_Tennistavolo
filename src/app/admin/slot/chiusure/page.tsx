import { createClient } from "@/lib/supabase/server";
import { createClosure, deleteClosure } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function ClosuresPage() {
  const supabase = await createClient();
  const { data: closures } = await supabase
    .from("club_closures")
    .select("*")
    .order("start_date");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Chiusure del centro</h1>
      <p className="mb-6 text-slate-600">
        Nei giorni di chiusura il calendario è bloccato e le prenotazioni vengono rifiutate.
      </p>

      <form
        action={createClosure}
        className="card mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
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
        <p className="text-sm text-slate-500">Nessuna chiusura definita.</p>
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
    </div>
  );
}
