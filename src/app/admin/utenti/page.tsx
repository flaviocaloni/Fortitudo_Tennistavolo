import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminCreateUser } from "@/lib/actions/users";
import type { Profile } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";
import AdminUsersListClient from "@/components/admin-users-list-client";
import * as championships from "@/lib/supabase/championships";

export const dynamic = "force-dynamic";

interface AuthInfo {
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  provider: string;
}

export default async function AdminUtentiPage(
  props: {
    searchParams: Promise<{ error?: string; ok?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  // Email e dati di accesso arrivano dall'API amministrativa (service role)
  const authInfo = new Map<string, AuthInfo>();
  if (admin) {
    const { data } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of data?.users ?? []) {
      authInfo.set(u.id, {
        email: u.email ?? "—",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
        provider: u.app_metadata?.provider ?? "email",
      });
    }
  }

  const users = (profiles ?? []).map((p: Profile) => ({
    profile: p,
    info: authInfo.get(p.id),
  }));

  // Fetch all teams from all championships for the dropdown
  const { data: allTeams } = await supabase
    .from("championship_teams")
    .select("id, name, series, group_code, championship_id")
    .eq("status", "active")
    .order("name");

  // Fetch championships to map IDs to names
  const { data: championshipsData } = await supabase
    .from("championships")
    .select("id, name");

  const championshipMap = new Map((championshipsData || []).map((c: any) => [c.id, c.name]));
  const teamsWithChampionship = (allTeams || []).map((t: any) => ({
    ...t,
    championshipName: championshipMap.get(t.championship_id),
  }));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Gestione utenti</h1>
      <ErrorBanner message={searchParams.error} />
      {searchParams.ok && (
        <div className="mb-4 rounded-md border border-navy-200 bg-navy-50 px-4 py-2 text-sm text-navy-800">
          {searchParams.ok}
        </div>
      )}

      {!admin && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <b>Modalità ridotta.</b> Per vedere le email e usare creazione
          utenti, reset e impostazione password, aggiungi{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> a <code>.env.local</code>{" "}
          (Supabase → Project Settings → API Keys → service_role) e riavvia il
          server.
        </div>
      )}

      {admin && (
        <details className="card mb-6">
          <summary className="cursor-pointer font-semibold text-navy-800">
            ➕ Registra nuovo utente
          </summary>
          <form
            action={adminCreateUser}
            className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div>
              <label className="label">Nome e cognome</label>
              <input name="full_name" required className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label">Password iniziale</label>
              <input name="password" required minLength={6} className="input" />
            </div>
            <div>
              <label className="label">Profilo</label>
              <select name="role" className="input" defaultValue="amatore">
                <option value="amatore">Amatore</option>
                <option value="agonista">Agonista</option>
              </select>
            </div>
            <div>
              <label className="label">Limite/settimana</label>
              <select name="weekly_limit" className="input" defaultValue="1">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <button className="btn-primary">Crea utente</button>
              <span className="ml-3 text-xs text-slate-500">
                L&apos;account è attivo subito (email già confermata):
                comunica tu la password iniziale.
              </span>
            </div>
          </form>
        </details>
      )}

      <AdminUsersListClient users={users} isAdmin={Boolean(admin)} teams={teamsWithChampionship} />
    </div>
  );
}
