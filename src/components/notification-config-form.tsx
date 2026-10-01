"use client";

import { useState } from "react";
import { toggleNotification, updateRecipientMode, fetchAdminsList, fetchUsersList } from "@/lib/actions/notifications";

interface NotificationConfig {
  id: number;
  notification_code: string;
  is_active: boolean;
  recipient_mode: "ALL_ADMINS" | "ALL_USERS" | "MANUAL";
  manual_recipient_ids: string[] | null;
  enable_telegram?: boolean;
}

interface NotificationConfigFormProps {
  config: NotificationConfig;
  notificationCode: "EVENT_NON_RECURRING_BOOKING" | "RECURRING_SLOT_BOOKING";
}

export default function NotificationConfigForm({
  config,
  notificationCode,
}: NotificationConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"activation" | "recipients">("activation");
  const [recipientMode, setRecipientMode] = useState(config.recipient_mode);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    config.manual_recipient_ids || []
  );
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [enableTelegram, setEnableTelegram] = useState(config.enable_telegram || false);

  const handleToggle = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("notification_code", notificationCode);
    formData.append("is_active", String(!config.is_active));
    await toggleNotification(formData);
  };

  const handleTelegramToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/toggle-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_code: notificationCode,
          enable_telegram: !enableTelegram,
        }),
      });
      if (response.ok) {
        setEnableTelegram(!enableTelegram);
      } else {
        alert("Errore nel salvataggio della configurazione Telegram");
      }
    } catch (error) {
      console.error("Error toggling Telegram:", error);
      alert("Errore nel salvataggio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      if (recipientMode === "ALL_ADMINS" || recipientMode === "MANUAL") {
        const admins = await fetchAdminsList();
        setAdminsList(admins);
      }
      if (recipientMode === "ALL_USERS") {
        const users = await fetchUsersList();
        setUsersList(users);
      }
    } catch (error) {
      console.error("Error loading recipients:", error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSaveRecipients = async () => {
    if (recipientMode === "MANUAL" && !selectedRecipients.length) {
      alert("Seleziona almeno un destinatario per la modalità manuale");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("notification_code", notificationCode);
    formData.append("recipient_mode", recipientMode);
    if (recipientMode === "MANUAL") {
      formData.append("manual_recipient_ids", selectedRecipients.join(","));
    }
    await updateRecipientMode(formData);
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId) ? prev.filter((id) => id !== recipientId) : [...prev, recipientId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("activation")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === "activation"
              ? "border-navy-700 text-navy-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Attivazione
        </button>
        <button
          onClick={() => setActiveTab("recipients")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === "recipients"
              ? "border-navy-700 text-navy-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Destinatari
        </button>
      </div>

      {/* Tab: Activation */}
      {activeTab === "activation" && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div>
              <p className="font-medium">Stato Notifica</p>
              <p className="text-sm text-slate-600">
                {config.is_active
                  ? "Le notifiche email verranno inviate per le nuove prenotazioni"
                  : "Le notifiche email sono disattivate e non verranno inviate"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md font-medium text-white transition ${
                config.is_active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              } disabled:opacity-50`}
            >
              {isLoading ? "..." : config.is_active ? "Disattiva" : "Attiva"}
            </button>
          </div>

          {!config.is_active && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ La configurazione è salvata, ma non verranno inviate email fino alla riattivazione.
            </div>
          )}

          {/* Telegram Toggle */}
          <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div>
              <p className="font-medium">📱 Telegram</p>
              <p className="text-sm text-slate-600">
                {enableTelegram
                  ? "Notifiche verranno inviate anche sul canale Telegram"
                  : "Notifiche Telegram disattivate"}
              </p>
            </div>
            <button
              onClick={handleTelegramToggle}
              disabled={isLoading || !config.is_active}
              className={`px-4 py-2 rounded-md font-medium text-white transition ${
                enableTelegram
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-400 hover:bg-slate-500"
              } disabled:opacity-50`}
              title={!config.is_active ? "Attiva prima le notifiche email" : ""}
            >
              {isLoading ? "..." : enableTelegram ? "Disattiva" : "Attiva"}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Recipients */}
      {activeTab === "recipients" && (
        <div className="space-y-4 pt-4">
          <div>
            <label className="label mb-2">Modalità Destinatari</label>
            <select
              value={recipientMode}
              onChange={(e) => {
                setRecipientMode(e.target.value as any);
                setAdminsList([]);
                setUsersList([]);
              }}
              className="input mb-4"
            >
              <option value="ALL_ADMINS">Tutti gli Admin</option>
              <option value="ALL_USERS">Tutti gli Utenti Attivi</option>
              <option value="MANUAL">Selezione Manuale</option>
            </select>

            {recipientMode !== "MANUAL" && (
              <button
                onClick={handleLoadRecipients}
                disabled={loadingRecipients}
                className="btn-navy mb-4"
              >
                {loadingRecipients ? "Caricamento..." : "Anteprima Destinatari"}
              </button>
            )}

            {/* Preview recipienti */}
            {recipientMode === "ALL_ADMINS" && adminsList.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium mb-2">
                  {adminsList.length} Admin riceveranno questa notifica:
                </p>
                <ul className="space-y-1 text-sm">
                  {adminsList.map((admin) => (
                    <li key={admin.id} className="text-slate-600">
                      {admin.full_name} ({admin.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipientMode === "ALL_USERS" && usersList.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium mb-2">
                  {usersList.length} Utenti riceveranno questa notifica:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                  {usersList.map((user) => (
                    <li key={user.id} className="text-slate-600">
                      {user.full_name} ({user.email}) — {user.role}
                    </li>
                  ))}
                </div>
              </div>
            )}

            {/* Selezione manuale */}
            {recipientMode === "MANUAL" && (
              <div className="space-y-3">
                <button
                  onClick={handleLoadRecipients}
                  disabled={loadingRecipients}
                  className="btn-ghost text-sm mb-3"
                >
                  {loadingRecipients ? "Caricamento..." : "Carica Admin"}
                </button>

                {adminsList.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium mb-2">Seleziona Admin:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {adminsList.map((admin) => (
                        <label key={admin.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(admin.id)}
                            onChange={() => toggleRecipient(admin.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {admin.full_name} ({admin.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecipients.length === 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Seleziona almeno un destinatario
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSaveRecipients}
            disabled={isLoading || (recipientMode === "MANUAL" && !selectedRecipients.length)}
            className="btn-navy w-full"
          >
            {isLoading ? "Salvataggio..." : "Salva Configurazione"}
          </button>
        </div>
      )}
    </div>
  );
}
