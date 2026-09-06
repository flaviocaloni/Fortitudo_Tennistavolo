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

  // Notifiche Prenotazioni
  const { data: bookingConfig, error: bookingConfigError } = await getNotificationConfig(
    dbClient,
    "EVENT_NON_RECURRING_BOOKING"
  );

  const { data: bookingAuditLog } = bookingConfig
    ? await getNotificationAuditLog(dbClient, bookingConfig.id)
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
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT - CAMPIONATO */}
      {currentTab === "campionato" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Rimozione Presenza Partita
                </h2>
                <p className="text-gray-600 mt-2">
                  Notifica quando un agonista rimuove la propria presenza da una partita di campionato.
                </p>
              </div>

              <form action={toggleNotification}>
                <input
                  type="hidden"
                  name="notification_code"
                  value="CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED"
                />
                <input
                  type="hidden"
                  name="is_active"
                  value={String(!attendanceRemovedConfig?.is_active)}
                />
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                    attendanceRemovedConfig?.is_active
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {attendanceRemovedConfig?.is_active ? "Disattiva" : "Attiva"}
                </button>
              </form>
            </div>

            {attendanceRemovedConfig?.is_active && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold">✓ Notifica attiva</p>
              </div>
            )}

            {/* RECIPIENT MODE */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Destinatari</h3>

              <form action={updateRecipientMode} className="space-y-6">
                <input
                  type="hidden"
                  name="notification_code"
                  value="CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED"
                />

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="recipient_mode"
                      value="ALL_ADMINS"
                      defaultChecked={
                        attendanceRemovedConfig?.recipient_mode === "ALL_ADMINS"
                          ? true
                          : undefined
                      }
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Tutti gli admin</div>
                      <div className="text-sm text-gray-600">
                        Invia notifiche a tutti gli utenti con ruolo amministratore
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="recipient_mode"
                      value="ALL_USERS"
                      defaultChecked={
                        attendanceRemovedConfig?.recipient_mode === "ALL_USERS"
                          ? true
                          : undefined
                      }
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Tutti gli utenti</div>
                      <div className="text-sm text-gray-600">
                        Invia notifiche a tutti gli utenti autenticati
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="recipient_mode"
                      value="MANUAL"
                      defaultChecked={
                        attendanceRemovedConfig?.recipient_mode === "MANUAL"
                          ? true
                          : undefined
                      }
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Destinatari specifici</div>
                      <div className="text-sm text-gray-600 mb-3">
                        Seleziona manualmente gli utenti destinatari
                      </div>

                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                        {allUsers?.map((user: any) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              name="manual_recipient_ids"
                              value={user.id}
                              defaultChecked={
                                attendanceRemovedConfig?.manual_recipient_ids?.includes(
                                  user.id
                                )
                                  ? true
                                  : undefined
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-900">{user.full_name}</span>
                            <span className="text-xs text-gray-500">({user.role})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Salva Configurazione
                </button>
              </form>
            </div>
          </div>

          {/* INFO */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Informazioni</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                • Le notifiche verranno inviate via email quando un agonista rimuove la propria
                presenza
              </li>
              <li>• La notifica contiene i dettagli della partita e il nome dell'agonista</li>
              <li>
                • Ogni notifica ha una chiave di idempotenza per evitare duplicati in caso di
                retry
              </li>
              <li>• Gli errori di invio email non causano rollback della presenza</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
