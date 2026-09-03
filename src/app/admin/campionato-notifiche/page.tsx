import { redirect } from "next/redirect";
import { getSessionProfile } from "@/lib/supabase/server";
import * as notifications from "@/lib/supabase/notifications";
import {
  toggleNotification,
  updateRecipientMode,
} from "@/lib/actions/notifications";

export default async function AdminChampionatoNotificheePage() {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/campionato");
  }

  // Recupera configurazione notifiche campionato
  const { data: attendanceRemovedConfig } = await notifications.getNotificationConfig(
    supabase,
    "CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED"
  );

  // Recupera utenti per destinatari manuali
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Configurazione Notifiche Campionato
      </h1>

      {/* ATTENDANCE REMOVED NOTIFICATION */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Rimozione Presenza Partita
            </h2>
            <p className="text-gray-600 mt-2">
              Notifica quando un agonista rimuove la propria presenza da una partita di
              campionato.
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
  );
}
