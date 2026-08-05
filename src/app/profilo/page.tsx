import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { updateOwnName } from "@/lib/actions/profile";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  admin: "Amministratore",
  agonista: "Agonista",
  amatore: "Amatore",
};

export default async function ProfiloPage(props: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleString("it-IT", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "—";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">👤 Il mio profilo</h1>
      <ErrorBanner message={searchParams.error} />
      {searchParams.ok && (
        <div className="mb-4 rounded-md border border-navy-200 bg-navy-50 px-4 py-2 text-sm text-navy-800">
          {searchParams.ok}
        </div>
      )}

      <div className="card mb-4">
        <h2 className="mb-3 font-semibold text-navy-800">Dati account</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Profilo</dt>
            <dd>
              <span
                className={`badge ${
                  profile.role === "admin"
                    ? "bg-amber-100 text-amber-800"
                    : profile.role === "agonista"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-navy-100 text-navy-800"
                }`}
              >
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Prenotazioni settimanali</dt>
            <dd className="font-medium">max {profile.weekly_limit} a settimana</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Registrato il</dt>
            <dd>{fmt(user.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Ultimo accesso</dt>
            <dd>{fmt(user.last_sign_in_at)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Profilo e limite settimanale sono assegnati dall&apos;amministratore:
          per modificarli contatta il club.
        </p>
      </div>

      <form action={updateOwnName} className="card mb-4">
        <h2 className="mb-3 font-semibold text-navy-800">Nome visualizzato</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grow">
            <label className="label">Nome e cognome</label>
            <input
              name="full_name"
              defaultValue={profile.full_name}
              required
              className="input"
            />
          </div>
          <button className="btn-navy">Salva</button>
        </div>
      </form>

      <div className="card">
        <h2 className="mb-2 font-semibold text-navy-800">Sicurezza</h2>
        <p className="mb-3 text-sm text-slate-600">
          Puoi impostare una nuova password di accesso in qualsiasi momento.
        </p>
        <Link href="/account/password" className="btn-primary">
          Cambia password
        </Link>
      </div>
    </div>
  );
}
