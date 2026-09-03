import { SupabaseClient } from "@supabase/supabase-js";

export async function getNotificationConfig(
  supabase: SupabaseClient,
  notificationCode: "EVENT_NON_RECURRING_BOOKING" | "CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED"
) {
  return supabase
    .from("notification_configs")
    .select("id, notification_code, is_active, recipient_mode, manual_recipient_ids")
    .eq("notification_code", notificationCode)
    .single();
}

export async function updateNotificationConfig(
  supabase: SupabaseClient,
  configId: number,
  updates: {
    is_active?: boolean;
    recipient_mode?: "ALL_ADMINS" | "ALL_USERS" | "MANUAL";
    manual_recipient_ids?: string[] | null;
  }
) {
  return supabase
    .from("notification_configs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", configId);
}

export async function getNotificationDeliveryHistory(
  supabase: SupabaseClient,
  bookingId: string
) {
  return supabase
    .from("notification_delivery")
    .select("id, recipient_email, status, error_code, sent_at, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
}

export async function getNotificationAuditLog(
  supabase: SupabaseClient,
  configId: number
) {
  return supabase
    .from("notification_audit")
    .select("id, change_type, modified_by, previous_state, new_state, modified_at")
    .eq("notification_config_id", configId)
    .order("modified_at", { ascending: false });
}
