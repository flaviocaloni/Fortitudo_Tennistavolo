import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/utils/roles";
import { toggleGoogleOAuth } from "@/lib/actions/admin";
import { isGoogleOAuthEnabled } from "@/lib/settings";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function GoogleOAuthPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { profile } = await getSessionProfile();

  if (!profile || !isSuperAdmin(profile.role)) {
    redirect("/calendario");
  }

  const supabase = await createClient();
  const googleOAuthEnabled = await isGoogleOAuthEnabled(supabase);

  return (
    <div>
      <div className="mb-6">
        <a href="/sys" className="text-sm text-blue-600 hover:underline">
          ← Torna a System Admin
        </a>
      </div>

      <h1 className="mb-2 text-2xl font-bold">🔐 Google OAuth</h1>
      <p className="mb-6 text-sm text-slate-600">
        Gestione Google OAuth authentication per la pagina di login.
      </p>

      <ErrorBanner message={searchParams.error} />

      <form
        action={toggleGoogleOAuth}
        className="card flex max-w-md flex-wrap items-end gap-4"
      >
        <div className="flex-1">
          <label className="label">Stato</label>
          <select
            name="enabled"
            defaultValue={googleOAuthEnabled ? "true" : "false"}
            className="input w-full"
          >
            <option value="true">✅ Abilitato</option>
            <option value="false">❌ Disabilitato</option>
          </select>
        </div>
        <button className="btn-navy">Salva</button>
      </form>

      <div className="card mt-6 bg-slate-50">
        <h2 className="mb-3 font-semibold">Informazioni</h2>
        <p className="mb-2 text-sm text-slate-700">
          Quando <strong>Abilitato</strong>:
        </p>
        <ul className="mb-4 space-y-1 text-sm text-slate-600">
          <li>✅ Il bottone "Continua con Google" è visibile nella pagina di login</li>
          <li>✅ Gli utenti possono registrarsi/accedere con account Google</li>
        </ul>
        <p className="mb-2 text-sm text-slate-700">
          Quando <strong>Disabilitato</strong>:
        </p>
        <ul className="text-sm text-slate-600">
          <li>❌ Il bottone "Continua con Google" non è visibile</li>
          <li>❌ Solo Email + Password è disponibile per login</li>
          <li>ℹ️ Gli utenti registrati via Google possono ancora accedere con email</li>
        </ul>
      </div>

      <div className="card mt-6 border-l-4 border-blue-500 bg-blue-50">
        <h3 className="mb-2 font-semibold text-blue-900">🔐 Superadmin Only</h3>
        <p className="text-sm text-blue-800">
          Questa sezione è accessibile solo dai Superadmin. Le modifiche vengono applicate immediatamente.
        </p>
      </div>
    </div>
  );
}
