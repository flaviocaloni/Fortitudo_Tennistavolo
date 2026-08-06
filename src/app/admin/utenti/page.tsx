import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminCreateUser,
  adminSendPasswordReset,
  adminSetPassword,
  adminUpdateUser,
} from "@/lib/actions/users";
import { impersonateUser } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";

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

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "mai";

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("it-IT", { dateStyle: "long" }) : "—";

  const getCertStatus = (expiry: string | null) => {
    if (!expiry) return { status: "missing", label: "Cert. mancante", color: "bg-slate-100 text-slate-800" };
    const exp = new Date(expiry);
    const today = new Date();
    const daysLeft = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: "expired", label: "Cert. SCADUTO", color: "bg-red-100 text-red-800" };
    if (daysLeft <= 30) return { status: "expiring", label: `Cert. scade tra ${daysLeft}gg`, color: "bg-amber-100 text-amber-800" };
    return { status: "valid", label: "Cert. valido", color: "bg-green-100 text-green-800" };
  };

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

      <p className="mb-3 text-sm text-slate-600">
        {(profiles ?? []).length} utenti registrati
      </p>

      <div className="space-y-3">
        {(profiles ?? []).map((p: Profile) => {
          const info = authInfo.get(p.id);
          return (
            <div key={p.id} className="card">
              <div className="mb-2 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-semibold">{p.full_name}</span>
                    {info && (
                      <span className="ml-2 text-sm text-slate-500">
                        {info.email} · via {info.provider}
                        {!info.confirmed && (
                          <span className="badge ml-2 bg-amber-100 text-amber-800">
                            email non confermata
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    Registrato: {fmt(info?.created_at ?? p.created_at)} · Ultimo
                    accesso: {fmt(info?.last_sign_in_at ?? null)}
                  </span>
                </div>
                {(() => {
                  const cert = getCertStatus(p.medical_certificate_expiry);
                  return (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={`badge ${cert.color}`}>{cert.label}</span>
                      {p.medical_certificate_expiry && (
                        <span className="text-slate-600">
                          Scade il: {fmtDate(p.medical_certificate_expiry)}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-end gap-4">
                {/* Modifica dati di registrazione */}
                <form
                  action={adminUpdateUser}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="user_id" value={p.id} />
                  <div>
                    <label className="label">Nome</label>
                    <input
                      name="full_name"
                      defaultValue={p.full_name}
                      className="input w-44"
                    />
                  </div>
                  {admin && (
                    <div>
                      <label className="label">Email</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={info?.email ?? ""}
                        className="input w-56"
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">Ruolo</label>
                    <select name="role" className="input w-auto" defaultValue={p.role}>
                      <option value="amatore">Amatore</option>
                      <option value="agonista">Agonista</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Limite/sett.</label>
                    <select
                      name="weekly_limit"
                      className="input w-auto"
                      defaultValue={p.weekly_limit}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <button className="btn-navy">Salva</button>
                </form>

                {admin && info && (
                  <>
                    {/* Reset password via email */}
                    <form action={adminSendPasswordReset}>
                      <input type="hidden" name="email" value={info.email} />
                      <button className="btn-ghost">
                        ✉️ Invia reset password
                      </button>
                    </form>

                    {/* Forza nuova password */}
                    <form action={adminSetPassword} className="flex items-end gap-2">
                      <input type="hidden" name="user_id" value={p.id} />
                      <div>
                        <label className="label">Nuova password</label>
                        <input
                          name="new_password"
                          minLength={6}
                          required
                          className="input w-40"
                          placeholder="min 6 caratteri"
                        />
                      </div>
                      <button className="btn-ghost">Imposta</button>
                    </form>

                    {/* Impersona utente */}
                    <form action={impersonateUser}>
                      <input type="hidden" name="user_id" value={p.id} />
                      <button className="btn-ghost">👁️ Accedi come</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
