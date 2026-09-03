import { redirect } from "next/redirect";
import { getSessionProfile } from "@/lib/supabase/server";
import { getNotificationConfig, getNotificationAuditLog } from "@/lib/supabase/notifications";
import ErrorBanner from "@/components/error-banner";
import NotificationConfigForm from "@/components/notification-config-form";

export const dynamic = "force-dynamic";

export default async function NotificheAdminPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "admin") {
    redirect("/calendario");
  }

  const { data: config, error: configError } = await getNotificationConfig(
    supabase,
    "EVENT_NON_RECURRING_BOOKING"
  );

  const { data: auditLog } = config
    ? await getNotificationAuditLog(supabase, config.id)
    : { data: null };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Configurazione Notifiche</h1>
      <p className="mb-4 text-sm text-slate-600">
        Gestisci le notifiche email per gli eventi di prenotazione
      </p>

      <ErrorBanner message={searchParams.error} />

      {searchParams.success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          ✓ {searchParams.success}
        </div>
      )}

      {configError || !config ? (
        <div className="card border-red-100 bg-red-50 text-sm text-red-800">
          Errore nel caricamento della configurazione
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Notifica Evento Non Ricorrente */}
          <div className="card">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Prenotazione Evento</h2>
                <p className="text-sm text-slate-600">
                  Inviata quando un utente prenota un allenamento su uno slot evento (non ricorrente)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    config.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {config.is_active ? "ATTIVA" : "DISATTIVA"}
                </span>
                <span className="badge bg-blue-100 text-blue-800">EMAIL</span>
              </div>
            </div>

            {/* Form di configurazione */}
            <NotificationConfigForm
              config={config}
              notificationCode="EVENT_NON_RECURRING_BOOKING"
            />
          </div>

          {/* Audit Log */}
          {auditLog && auditLog.length > 0 && (
            <div className="card">
              <h3 className="mb-3 font-semibold">Storico Modifiche</h3>
              <div className="space-y-2">
                {auditLog.map((entry: any) => (
                  <div key={entry.id} className="border-l-2 border-slate-200 py-2 pl-3 text-sm">
                    <div className="font-medium text-slate-700">
                      {entry.change_type === "activated" && "🟢 Attivata"}
                      {entry.change_type === "deactivated" && "🔴 Disattivata"}
                      {entry.change_type === "updated" && "✏️ Modificata"}
                      {entry.change_type === "created" && "➕ Creata"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.modified_at).toLocaleString("it-IT")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
