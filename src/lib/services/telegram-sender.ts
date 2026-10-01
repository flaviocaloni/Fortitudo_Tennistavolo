import { SupabaseClient } from "@supabase/supabase-js";

export interface TelegramPayload {
  bookingTitle: string;
  userName: string;
  slotName: string;
  sessionDate: string;
  registrationDate: string; // data di registrazione della prenotazione
  bookingId: string;
  notificationConfigId: number;
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
  // Verifica configurazione
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.warn("[TelegramSender] Telegram not configured, skipping");
    return { success: false, error: "Telegram not configured" };
  }

  try {
    // Costruisci messaggio formattato
    const message = buildTelegramMessage(payload);

    // Invia via Telegram Bot API
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

    if (!result.ok) {
      console.error("[TelegramSender] API error:", result.description);
      return {
        success: false,
        error: result.description,
      };
    }

    const messageId = result.result.message_id;

    // Log a notification_delivery
    try {
      await supabase.from("notification_delivery").insert({
        notification_config_id: payload.notificationConfigId,
        booking_id: payload.bookingId,
        recipient_user_id: null, // broadcast a canale
        recipient_email: "telegram-broadcast", // placeholder
        channel: "TELEGRAM",
        provider: "TELEGRAM",
        provider_message_id: messageId.toString(),
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("[TelegramSender] Log error (non-blocking):", logError);
    }

    console.log(`[TelegramSender] Message sent: ${messageId}`);
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

function buildTelegramMessage(payload: TelegramPayload): string {
  return `🎾 <b>Prenotazione Confermata</b>

<b>Giocatore:</b> ${payload.userName}
<b>Slot:</b> ${payload.slotName}
<b>Data Evento:</b> ${payload.sessionDate}
<b>Data Registrazione:</b> ${payload.registrationDate}

✅ La prenotazione è confermata!`;
}
