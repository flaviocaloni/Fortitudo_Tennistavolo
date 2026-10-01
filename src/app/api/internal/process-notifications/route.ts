import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationTelegram } from "@/lib/services/telegram-sender";
import { resolveNotificationRecipients, deduplicateRecipients } from "@/lib/services/recipients-resolver";
import { getNotificationConfig } from "@/lib/supabase/notifications";
import { sendNotificationEmail } from "@/lib/services/email-sender";
import { NextRequest, NextResponse } from "next/server";
import * as championships from "@/lib/supabase/championships";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Admin client not configured" },
        { status: 500 }
      );
    }

    const { bookingId, slotId, sessionDate, userId } = await request.json();

    if (!bookingId || !slotId || !sessionDate || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[process-notifications] Processing booking:", bookingId);

    // Leggi lo slot
    const { data: slot } = await supabase
      .from("training_slots")
      .select("event_date, weekday, title, start_time, end_time")
      .eq("id", slotId)
      .single();

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Determina tipo notifica
    let notificationCode: "EVENT_NON_RECURRING_BOOKING" | "RECURRING_SLOT_BOOKING";
    if (slot.event_date) {
      notificationCode = "EVENT_NON_RECURRING_BOOKING";
    } else if (slot.weekday !== null) {
      notificationCode = "RECURRING_SLOT_BOOKING";
    } else {
      return NextResponse.json(
        { error: "Slot type not recognized" },
        { status: 400 }
      );
    }

    // Leggi config
    const { data: config } = await getNotificationConfig(supabase, notificationCode);
    if (!config || !config.is_active) {
      return NextResponse.json({ success: true, reason: "Notification inactive" });
    }

    // Leggi profilo
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Risolvi destinatari
    const recipients = await resolveNotificationRecipients(config.id, supabase);
    const dedupRecipients = await deduplicateRecipients(recipients);

    if (!dedupRecipients.length) {
      return NextResponse.json({ success: true, reason: "No recipients" });
    }

    // Invia email
    if (config.email_enabled) {
      console.log("[process-notifications] Sending emails...");
      for (const recipient of dedupRecipients) {
        try {
          await sendNotificationEmail(
            {
              to: recipient.email,
              subject: `Prenotazione confermata: ${slot.title}`,
              html: `<p>Prenotazione confermata per ${slot.title} del ${sessionDate}</p>`,
              bookingId,
              recipientUserId: recipient.userId,
              notificationConfigId: config.id,
            },
            supabase
          );
        } catch (e) {
          console.error("[process-notifications] Email error:", e);
        }
      }
    }

    // Invia Telegram
    if (config.telegram_enabled) {
      console.log("[process-notifications] Sending Telegram...");
      try {
        const registrationDate = new Date().toLocaleDateString("it-IT", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        await sendNotificationTelegram(
          {
            bookingTitle: `${profile.full_name} - ${slot.title}`,
            userName: profile.full_name,
            slotName: slot.title,
            sessionDate,
            registrationDate,
            bookingId,
            notificationConfigId: config.id,
          },
          supabase
        );
      } catch (e) {
        console.error("[process-notifications] Telegram error:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[process-notifications] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
