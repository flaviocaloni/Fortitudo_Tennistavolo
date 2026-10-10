import { SupabaseClient } from "@supabase/supabase-js";

export interface TelegramPayload {
  bookingTitle: string;
  userName: string;
  slotName: string;
  sessionDate: string;
  registrationDate: string; // data di registrazione della prenotazione
  bookingId: string;
  notificationConfigId: number;
  // Campi opzionali per notifiche di campionato
  teamName?: string;
  opponentName?: string;
  notificationType?: "booking" | "attendance_removed";
}

interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

export async function sendNotificationTelegram(
  payload: TelegramPayload,
  supabase: SupabaseClient
): Promise<TelegramResult> {
  console.log("[TelegramSender] Starting Telegram notification send...");

  // Verifica configurazione
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error("[TelegramSender] Configuration missing:", {
      hasToken: !!TELEGRAM_BOT_TOKEN,
      hasChannelId: !!TELEGRAM_CHANNEL_ID,
    });
    return { success: false, error: "Telegram not configured" };
  }

  try {
    // Costruisci messaggio formattato
    const message = buildTelegramMessage(payload);
    console.log("[TelegramSender] Message built:", {
      bookingId: payload.bookingId,
      messageLength: message.length
    });

    // Invia via Telegram Bot API
    console.log("[TelegramSender] Calling Telegram API...");
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const result = await response.json();
    console.log("[TelegramSender] Telegram API response:", { ok: result.ok, status: response.status });

    if (!result.ok) {
      console.error("[TelegramSender] API error:", {
        description: result.description,
        errorCode: result.error_code,
      });
      return {
        success: false,
        error: result.description,
      };
    }

    const messageId = result.result.message_id;
    console.log("[TelegramSender] Message sent successfully:", messageId);

    // Aggiorna log con status='sent' e message_id
    try {
      await supabase
        .from("notification_delivery")
        .update({
          provider_message_id: messageId.toString(),
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("booking_id", payload.bookingId)
        .eq("channel", "TELEGRAM")
        .eq("status", "pending");
      console.log("[TelegramSender] Log updated to sent status");
    } catch (logError) {
      console.error("[TelegramSender] Log update error (non-blocking):", logError);
    }

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("[TelegramSender] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendConvocationsSummaryToTelegram(
  message: string
): Promise<TelegramResult> {
  console.log("[TelegramSender] Sending convocations summary...");

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error("[TelegramSender] Configuration missing");
    return { success: false, error: "Telegram not configured" };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const result = await response.json();
    console.log("[TelegramSender] Response:", { ok: result.ok });

    if (!result.ok) {
      console.error("[TelegramSender] API error:", result.description);
      return { success: false, error: result.description };
    }

    return { success: true, messageId: result.result.message_id };
  } catch (error) {
    console.error("[TelegramSender] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function buildTelegramMessage(payload: TelegramPayload): string {
  // Formatta data con fuso orario di Roma (Europe/Rome)
  const registrationDateFormatted = new Date(payload.registrationDate).toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Template per rimozione presenza da campionato
  if (payload.notificationType === "attendance_removed") {
    return `⛔ <b>Rimozione Presenza Partita</b>

<b>Giocatore:</b> ${payload.userName}
<b>Squadra:</b> ${payload.teamName}
<b>Avversario:</b> ${payload.opponentName}
<b>Data Evento:</b> ${payload.sessionDate}
<b>Data Registrazione:</b> ${registrationDateFormatted}

⚠️ L'agonista ha rimosso la propria presenza!`;
  }

  // Template per prenotazione evento (default)
  return `🎾 <b>Prenotazione Confermata</b>

<b>Giocatore:</b> ${payload.userName}
<b>Slot:</b> ${payload.slotName}
<b>Data Evento:</b> ${payload.sessionDate}
<b>Data Registrazione:</b> ${registrationDateFormatted}

✅ La prenotazione è confermata!`;
}
