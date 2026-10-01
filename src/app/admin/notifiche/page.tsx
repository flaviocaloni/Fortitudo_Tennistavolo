import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { getNotificationConfig, getNotificationAuditLog } from "@/lib/supabase/notifications";
import { toggleNotification, updateRecipientMode } from "@/lib/actions/notifications";
import ErrorBanner from "@/components/error-banner";
import NotificationConfigForm from "@/components/notification-config-form";

export const dynamic = "force-dynamic";

export default async function NotificheAdminPage(props: {
  searchParams: Promise<{ error?: string; success?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();

  if (!user || !profile || !isAdmin(profile.role)) {
    redirect("/calendario");
  }

  // Use admin client to bypass RLS for data queries
  const admin = createAdminClient();
  const dbClient = admin || supabase;

  const currentTab = searchParams.tab || "prenotazioni";

  // Notifiche Prenotazioni - Eventi non ricorrenti
  const { data: bookingConfig, error: bookingConfigError } = await getNotificationConfig(
    dbClient,
    "EVENT_NON_RECURRING_BOOKING"
  );

  const { data: bookingAuditLog } = bookingConfig
    ? await getNotificationAuditLog(dbClient, bookingConfig.id)
    : { data: null };

  // Notifiche Prenotazioni - Slot ricorrenti
  const { data: recurringConfig, error: recurringConfigError } = await getNotificationConfig(
    dbClient,
    "RECURRING_SLOT_BOOKING"
  );

  const { data: recurringAuditLog } = recurringConfig
    ? await getNotificationAuditLog(dbClient, recurringConfig.id)
    : { data: null };

  // Notifiche Campionato
  const { data: attendanceRemovedConfig } = await getNotificationConfig(
    dbClient,
    "CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED"
  );

  const { data: allUsers } = await dbClient
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Configurazione Notifiche</h1>
      <p className="mb-6 text-sm text-slate-600">
        Gestisci le notifiche email per gli eventi
      </p>

      <ErrorBanner message={searchParams.error} />

      {searchParams.success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          ✓ {searchParams.success}
        </div>
      )}

      {/* TABS */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <a
          href="?tab=prenotazioni"
          className={`px-4 py-3 font-medium border-b-2 transition ${
            currentTab === "prenotazioni"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Prenotazioni
        </a>
        <a
          href="?tab=campionato"
          className={`px-4 py-3 font-medium border-b-2 transition ${
            currentTab === "campionato"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Campionato
        </a>
      </div>

      {/* TAB CONTENT - PRENOTAZIONI */}
      {currentTab === "prenotazioni" && (
        <div className="space-y-6">
          {bookingConfigError || !bookingConfig ? (
            <div className="card border-red-100 bg-red-50 text-sm text-red-800">
              Errore nel caricamento della configurazione
            </div>
          ) : (
            <>
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
                        bookingConfig.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {bookingConfig.is_active ? "ATTIVA" : "DISATTIVA"}
                    </span>
                    <span className="badge bg-blue-100 text-blue-800">EMAIL</span>
                  </div>
                </div>

                <NotificationConfigForm
                  config={bookingConfig}
                  notificationCode="EVENT_NON_RECURRING_BOOKING"
                />
              </div>

              {bookingAuditLog && bookingAuditLog.length > 0 && (
                <div className="card">
                  <h3 className="mb-3 font-semibold">Storico Modifiche</h3>
                  <div className="space-y-2">
                    {bookingAuditLog.map((entry: any) => (
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

              {/* SLOT RICORRENTI */}
              <div className="card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Prenotazione Slot Ricorrente</h2>
                    <p className="text-sm text-slate-600">
                      Inviata quando un utente prenota un allenamento regolare (slot ricorrente)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        recurringConfig?.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {recurringConfig?.is_active ? "ATTIVA" : "DISATTIVA"}
                    </span>
                    <span className="badge bg-blue-100 text-blue-800">EMAIL + TELEGRAM</span>
                  </div>
                </div>

                {recurringConfig && (
                  <NotificationConfigForm
                    config={recurringConfig}
                    notificationCode="RECURRING_SLOT_BOOKING"
                  />
                )}
              </div>

              {recurringAuditLog && recurringAuditLog.length > 0 && (
                <div className="card">
                  <h3 className="mb-3 font-semibold">Storico Modifiche (Slot Ricorrenti)</h3>
                  <div className="space-y-2">
                    {recurringAuditLog.map((entry: any) => (
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
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT - CAMPIONATO */}
      {currentTab === "campionato" && (
        <div className="space-y-6">
          {!attendanceRemovedConfig ? (
            <div className="card border-red-100 bg-red-50 text-sm text-red-800">
              Errore nel caricamento della configurazione
            </div>
          ) : (
            <>
              <div className="card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Rimozione Presenza Partita</h2>
                    <p className="text-sm text-slate-600">
                      Inviata quando un agonista rimuove la propria presenza da una partita di campionato
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        attendanceRemovedConfig.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {attendanceRemovedConfig.is_active ? "ATTIVA" : "DISATTIVA"}
                    </span>
                    <span className="badge bg-blue-100 text-blue-800">EMAIL + TELEGRAM</span>
                  </div>
                </div>

                <NotificationConfigForm
                  config={attendanceRemovedConfig}
                  notificationCode="CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
