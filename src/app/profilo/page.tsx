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

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("it-IT", { dateStyle: "long" }) : "—";

  const getCertStatus = (expiry?: string | null) => {
    if (!expiry) return { status: "missing", label: "Non inserito", color: "bg-slate-100 text-slate-800" };
    const exp = new Date(expiry);
    const today = new Date();
    const daysLeft = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: "expired", label: "Scaduto", color: "bg-red-100 text-red-800" };
    if (daysLeft <= 30) return { status: "expiring", label: `Scade tra ${daysLeft} gg`, color: "bg-amber-100 text-amber-800" };
    return { status: "valid", label: "Valido", color: "bg-green-100 text-green-800" };
  };

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

      <div className="card mb-4">
        <h2 className="mb-3 font-semibold text-navy-800">Certificato medico</h2>
        {(() => {
          const cert = getCertStatus(profile.medical_certificate_expiry);
          return (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-600">Data di scadenza:</span>
                <span className={`badge ${cert.color}`}>{cert.label}</span>
              </div>
              {profile.medical_certificate_expiry && (
                <p className="mb-3 text-sm text-slate-600">
                  Scade il: <span className="font-medium">{fmtDate(profile.medical_certificate_expiry)}</span>
                </p>
              )}
            </>
          );
        })()}
        <p className="text-xs text-slate-500">
          La data del certificato medico è gestita dall&apos;amministratore:
          per aggiornarla contatta il club.
        </p>
      </div>

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
