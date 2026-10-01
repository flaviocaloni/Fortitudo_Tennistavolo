"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import { sendNotificationEmail, buildBookingNotificationEmail } from "@/lib/services/email-sender";
import { sendNotificationTelegram } from "@/lib/services/telegram-sender";
import { resolveNotificationRecipients, deduplicateRecipients } from "@/lib/services/recipients-resolver";
import { getNotificationConfig } from "@/lib/supabase/notifications";

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Prenota uno slot per una data. Capienza, ruolo e limite settimanale
 *  sono validati dai trigger del database. */
export async function bookSlot(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  const sessionDate = String(formData.get("session_date") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error, data: booking } = await supabase.from("bookings").insert({
    slot_id: slotId,
    user_id: user.id,
    session_date: sessionDate,
  }).select("id").single();

  if (error) backWithError("/calendario", error.message);

  // Trigger asincrono per inviare notifiche email (non blocca il redirect)
  if (booking?.id) {
    sendNotificationForBooking(booking.id, slotId, sessionDate, user.id, supabase).catch((err) => {
      console.error("[bookSlot] Notification error (non-blocking):", err);
    });
  }

  revalidatePath("/calendario");
  revalidatePath("/prenotazioni");
  redirect("/calendario");
}

/** Invia notifiche email per una prenotazione (fire-and-forget) */
async function sendNotificationForBooking(
  bookingId: string,
  slotId: string,
  sessionDate: string,
  userId: string,
  supabase: any
) {
  try {
    console.log("[sendNotificationForBooking] START:", { bookingId, slotId, sessionDate, userId });

    // Leggi lo slot per determinare se è ricorrente o evento
    const { data: slot } = await supabase
      .from("training_slots")
      .select("event_date, weekday, title, start_time, end_time")
      .eq("id", slotId)
      .single();

    if (!slot) {
      console.log("[sendNotificationForBooking] Slot not found");
      return;
    }

    console.log("[sendNotificationForBooking] Slot loaded:", slot);

    // Determina il tipo di notifica in base al tipo di slot
    let notificationCode: "EVENT_NON_RECURRING_BOOKING" | "RECURRING_SLOT_BOOKING";

    if (slot.event_date) {
      // Slot evento (non ricorrente)
      notificationCode = "EVENT_NON_RECURRING_BOOKING";
    } else if (slot.weekday !== null) {
      // Slot ricorrente (ha weekday)
      notificationCode = "RECURRING_SLOT_BOOKING";
    } else {
      console.log("[sendNotificationForBooking] Slot type not recognized, skipping");
      return;
    }

    console.log("[sendNotificationForBooking] Notification code:", notificationCode);

    // Verifica se la notifica è attivata per questo tipo
    const { data: config, error: configError } = await getNotificationConfig(
      supabase,
      notificationCode
    );

    console.log("[sendNotificationForBooking] Config loaded:", { config, configError });

    if (!config || !config.is_active) {
      console.log(`[sendNotificationForBooking] ${notificationCode} inactive or missing, skipping`);
      return;
    }

    console.log("[sendNotificationForBooking] Config active, email_enabled:", config.email_enabled, "telegram_enabled:", config.telegram_enabled);

    // Verifica l'utente che ha prenotato
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (!profile) return;

    // Risolvi destinatari
    const recipients = await resolveNotificationRecipients(config.id, supabase);
    const dedupRecipients = await deduplicateRecipients(recipients);

    if (!dedupRecipients.length) {
      console.log("[sendNotificationForBooking] No recipients resolved");
      return;
    }

    // Costruisci email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fortitudo-tennistavolo.vercel.app";
    const { subject, html } = await buildBookingNotificationEmail(
      {
        slotTitle: slot.title,
        sessionDate,
        startTime: slot.start_time,
        endTime: slot.end_time,
        userName: profile.full_name,
      },
      siteUrl
    );

    // Invia email se abilitata (parallelo, fire-and-forget)
    if (config.email_enabled) {
      console.log(`[sendNotificationForBooking] Email enabled for ${notificationCode}, sending...`);
      await Promise.allSettled(
        dedupRecipients.map((recipient) =>
          sendNotificationEmail(
            {
              to: recipient.email,
              subject,
              html,
              bookingId,
              recipientUserId: recipient.userId,
              notificationConfigId: config.id,
            },
            supabase
          )
        )
      );
    } else {
      console.log(`[sendNotificationForBooking] Email disabled for ${notificationCode}`);
    }

    // Invia notifica Telegram se abilitata (fire-and-forget)
    if (config.telegram_enabled) {
      console.log(`[sendNotificationForBooking] Telegram enabled for ${notificationCode}, sending...`);
      const registrationDate = new Date().toLocaleDateString("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log("[sendNotificationForBooking] Telegram payload:", {
        userName: profile.full_name,
        slotName: slot.title,
        sessionDate,
        registrationDate,
        configId: config.id,
      });

      sendNotificationTelegram(
        {
          bookingTitle: `${profile.full_name} - ${slot.title}`,
          userName: profile.full_name,
          slotName: slot.title,
          sessionDate: sessionDate,
          registrationDate,
          bookingId,
          notificationConfigId: config.id,
        },
        supabase
      ).catch((err) => {
        console.error("[sendNotificationForBooking] Telegram error (non-blocking):", err);
      });

      console.log("[sendNotificationForBooking] Telegram send initiated (fire-and-forget)");
    } else {
      console.log(`[sendNotificationForBooking] Telegram disabled for ${notificationCode}`);
    }
  } catch (error) {
    console.error("[sendNotificationForBooking] Error:", error);
    // Non re-throw: la prenotazione è già confermata, l'errore non deve ripercuotersi
  }
}

/** Cancella (stato -> cancelled) una propria prenotazione.
 *  Amatori e agonisti non possono agire su prenotazioni passate: solo l'admin può. */
export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const from = String(formData.get("from") ?? "/prenotazioni");
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  if (profile?.role !== "admin") {
    const { data: booking } = await supabase
      .from("bookings")
      .select("session_date")
      .eq("id", bookingId)
      .single();

    if (booking && booking.session_date < toISODate(new Date())) {
      backWithError(from, "Non puoi modificare una prenotazione passata");
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq("id", bookingId)
    .eq("status", "active");

  if (error) backWithError(from, error.message);
  revalidatePath("/calendario");
  revalidatePath("/prenotazioni");
  revalidatePath("/admin/prenotazioni");
  redirect(from);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
