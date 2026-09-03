import nodemailer from "nodemailer";
import { SupabaseClient } from "@supabase/supabase-js";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  bookingId: string;
  recipientUserId: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

let transporter: nodemailer.Transporter | null = null;

function initializeTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!gmailUser || !gmailRefreshToken || !gmailClientId || !gmailClientSecret) {
    throw new Error(
      "Gmail credentials incomplete. Set GMAIL_USER, GMAIL_REFRESH_TOKEN, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET"
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      clientId: gmailClientId,
      clientSecret: gmailClientSecret,
      refreshToken: gmailRefreshToken,
    },
  });

  return transporter;
}

export async function sendNotificationEmail(
  payload: EmailPayload,
  supabase: SupabaseClient
): Promise<EmailResult> {
  const { to, subject, html, bookingId, recipientUserId } = payload;
  const idempotencyKey = `${bookingId}-${recipientUserId}`;

  try {
    // Verifica duplicazione: se esiste già un record per questo booking+recipient, salta
    const { data: existing } = await supabase
      .from("notification_delivery")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("recipient_user_id", recipientUserId)
      .single();

    if (existing) {
      return {
        success: false,
        errorCode: "DUPLICATE",
        error: "Notification already sent for this booking",
      };
    }

    const transport = initializeTransporter();

    // Invia email
    const info = await transport.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });

    // Registra invio riuscito
    await supabase.from("notification_delivery").insert({
      notification_config_id: 1, // ID della config EVENT_NON_RECURRING_BOOKING
      booking_id: bookingId,
      recipient_user_id: recipientUserId,
      recipient_email: to,
      status: "sent",
      provider_response: info.messageId,
      sent_at: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error instanceof Error && "code" in error ? (error.code as string) : "UNKNOWN";

    // Registra errore
    await supabase.from("notification_delivery").insert({
      notification_config_id: 1,
      booking_id: bookingId,
      recipient_user_id: recipientUserId,
      recipient_email: to,
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
    });

    console.error(`[EmailSender] Failed to send email to ${to}:`, errorMessage);

    return {
      success: false,
      errorCode,
      error: errorMessage,
    };
  }
}

export async function buildBookingNotificationEmail(
  booking: {
    slotTitle: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    userName: string;
  },
  siteUrl: string
): Promise<{ subject: string; html: string }> {
  const dateFormatted = new Date(booking.sessionDate).toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `Nuova prenotazione: ${booking.slotTitle} il ${dateFormatted}`;

  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #003d7a; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { border: 1px solid #ddd; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; }
        .detail-label { font-weight: bold; color: #003d7a; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">Fortitudo Busnago Tennistavolo</h2>
          <p style="margin: 5px 0 0 0;">Notifica Prenotazione</p>
        </div>
        <div class="content">
          <p>Ciao,</p>
          <p><strong>${booking.userName}</strong> ha appena prenotato uno slot non ricorrente.</p>

          <div class="detail">
            <span class="detail-label">📅 Allenamento:</span> ${booking.slotTitle}
          </div>
          <div class="detail">
            <span class="detail-label">📍 Data:</span> ${dateFormatted}
          </div>
          <div class="detail">
            <span class="detail-label">⏰ Orario:</span> ${booking.startTime} — ${booking.endTime}
          </div>

          <p style="margin-top: 20px;">
            <a href="${siteUrl}/admin/prenotazioni" style="display: inline-block; padding: 10px 20px; background-color: #003d7a; color: white; text-decoration: none; border-radius: 4px;">
              Vedi Prenotazione
            </a>
          </p>

          <div class="footer">
            <p>Questa è una notifica automatica. Non rispondere a questa email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
