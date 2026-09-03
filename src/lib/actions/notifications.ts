"use server";

import { redirect } from "next/redirect";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import {
  getNotificationConfig,
  updateNotificationConfig,
  getNotificationAuditLog,
} from "@/lib/supabase/notifications";

async function requireAdmin() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/calendario");
  return supabase;
}

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Alterna attivazione/disattivazione notifica */
export async function toggleNotification(formData: FormData) {
  const supabase = await requireAdmin();

  const notificationCode = String(formData.get("notification_code") ?? "");
  const newIsActive = String(formData.get("is_active") ?? "true") === "true";

  const { data: config, error } = await getNotificationConfig(
    supabase,
    notificationCode as "EVENT_NON_RECURRING_BOOKING"
  );

  if (error || !config) {
    backWithError("/admin/notifiche", "Notifica non trovata");
  }

  const { error: updateError } = await updateNotificationConfig(supabase, config.id, {
    is_active: newIsActive,
  });

  if (updateError) {
    backWithError("/admin/notifiche", updateError.message);
  }

  redirect("/admin/notifiche");
}

/** Modifica modalità destinatari */
export async function updateRecipientMode(formData: FormData) {
  const supabase = await requireAdmin();

  const notificationCode = String(formData.get("notification_code") ?? "");
  const recipientMode = String(formData.get("recipient_mode") ?? "ALL_ADMINS");
  const manualRecipientIdsRaw = String(formData.get("manual_recipient_ids") ?? "");

  const { data: config, error } = await getNotificationConfig(
    supabase,
    notificationCode as "EVENT_NON_RECURRING_BOOKING"
  );

  if (error || !config) {
    backWithError("/admin/notifiche", "Notifica non trovata");
  }

  const manualRecipientIds =
    recipientMode === "MANUAL" && manualRecipientIdsRaw
      ? manualRecipientIdsRaw.split(",").map((id) => id.trim())
      : null;

  if (recipientMode === "MANUAL" && !manualRecipientIds?.length) {
    backWithError(
      "/admin/notifiche",
      "Seleziona almeno un destinatario per la modalità manuale"
    );
  }

  const { error: updateError } = await updateNotificationConfig(supabase, config.id, {
    recipient_mode: recipientMode as "ALL_ADMINS" | "ALL_USERS" | "MANUAL",
    manual_recipient_ids: manualRecipientIds,
  });

  if (updateError) {
    backWithError("/admin/notifiche", updateError.message);
  }

  redirect("/admin/notifiche?success=Configurazione aggiornata");
}

/** Fetch configurazione notifica (per componente client) */
export async function fetchNotificationConfig(
  notificationCode: "EVENT_NON_RECURRING_BOOKING"
) {
  const supabase = await requireAdmin();

  const { data, error } = await getNotificationConfig(supabase, notificationCode);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Fetch audit log */
export async function fetchNotificationAuditLog(configId: number) {
  const supabase = await requireAdmin();

  const { data, error } = await getNotificationAuditLog(supabase, configId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Fetch lista admin attivi */
export async function fetchAdminsList() {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/** Fetch lista tutti gli utenti attivi */
export async function fetchUsersList() {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
