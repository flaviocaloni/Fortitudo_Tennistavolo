import { createClient } from "@/lib/supabase/server";
import {
  adminCreateSeason,
  adminSetCurrentSeason,
  adminUpdateSeason,
} from "@/lib/actions/seasons";
import type { Season } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("it-IT", { dateStyle: "long" });
}

export default async function AdminStagioniPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("start_date", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Gestione stagioni</h1>
      <ErrorBanner message={searchParams.error} />

      <div className="mb-8">
        <h2 className="mb-2 font-semibold text-slate-700">Nuova stagione</h2>
        <form action={adminCreateSeason} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Nome</label>
            <input name="name" required placeholder="es. 2027/2028" className="input" />
          </div>
          <div>
            <label className="label">Data inizio</label>
            <input name="start_date" type="date" required className="input" />
          </div>
          <div>
            <label className="label">Data fine</label>
            <input name="end_date" type="date" required className="input" />
          </div>
          <div className="flex items-end">
            <button className="btn-primary">Crea stagione</button>
          </div>
        </form>
      </div>

      <h2 className="mb-2 font-semibold text-slate-700">Stagioni</h2>
      <div className="space-y-3">
        {(seasons ?? []).map((s: Season) => (
          <div key={s.id} className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{s.name}</span>
                {s.is_current ? (
                  <span className="badge bg-green-100 text-green-800">Corrente</span>
                ) : (
                  <form action={adminSetCurrentSeason}>
                    <input type="hidden" name="season_id" value={s.id} />
                    <button className="btn-ghost text-xs">Imposta come corrente</button>
                  </form>
                )}
              </div>
              <span className="text-sm text-slate-600">
                {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
              </span>
            </div>

            <form action={adminUpdateSeason} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="season_id" value={s.id} />
              <div>
                <label className="label">Nome</label>
                <input name="name" defaultValue={s.name} className="input w-40" />
              </div>
              <div>
                <label className="label">Data inizio</label>
                <input name="start_date" type="date" defaultValue={s.start_date} className="input" />
              </div>
              <div>
                <label className="label">Data fine</label>
                <input name="end_date" type="date" defaultValue={s.end_date} className="input" />
              </div>
              <button className="btn-navy">Salva</button>
            </form>
          </div>
        ))}
        {(seasons ?? []).length === 0 && (
          <p className="text-sm text-slate-500">Nessuna stagione definita.</p>
        )}
      </div>
    </div>
  );
}
