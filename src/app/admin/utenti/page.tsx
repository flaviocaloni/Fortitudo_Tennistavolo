import { createClient } from "@/lib/supabase/server";
import { updateUser } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function AdminUtentiPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Gestione utenti</h1>
      <ErrorBanner message={searchParams.error} />
      <p className="mb-4 text-sm text-slate-600">
        Ruolo e limite settimanale di prenotazioni sono modificabili solo da qui.
      </p>

      <div className="space-y-2">
        {(profiles ?? []).map((p: Profile) => (
          <form
            key={p.id}
            action={updateUser}
            className="card flex flex-wrap items-center justify-between gap-3"
          >
            <input type="hidden" name="user_id" value={p.id} />
            <div>
              <p className="font-medium">{p.full_name}</p>
              <p className="text-xs text-slate-500">
                Iscritto il {new Date(p.created_at).toLocaleDateString("it-IT")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select name="role" className="input w-auto" defaultValue={p.role}>
                <option value="amatore">Amatore</option>
                <option value="agonista">Agonista</option>
                <option value="admin">Admin</option>
              </select>
              <select
                name="weekly_limit"
                className="input w-auto"
                defaultValue={p.weekly_limit}
              >
                <option value="1">1/sett.</option>
                <option value="2">2/sett.</option>
                <option value="3">3/sett.</option>
              </select>
              <button className="btn-primary">Salva</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
