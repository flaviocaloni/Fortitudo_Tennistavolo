import { SupabaseClient } from "@supabase/supabase-js";

export interface Recipient {
  userId: string;
  email: string;
  fullName: string;
}

export async function resolveNotificationRecipients(
  notificationConfigId: number,
  supabase: SupabaseClient
): Promise<Recipient[]> {
  try {
    // Leggi configurazione notifica
    const { data: config, error: configError } = await supabase
      .from("notification_configs")
      .select("recipient_mode, manual_recipient_ids")
      .eq("id", notificationConfigId)
      .single();

    if (configError || !config) {
      console.error("[RecipientsResolver] Config not found:", configError?.message);
      return [];
    }

    const { recipient_mode, manual_recipient_ids } = config;
    let recipientIds: string[] = [];

    if (recipient_mode === "ALL_ADMINS") {
      // Seleziona tutti gli admin attivi con email valida
      const { data: admins, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", "admin")
        .eq("is_active", true)
        .not("email", "is", null);

      if (error) {
        console.error("[RecipientsResolver] Error fetching admins:", error.message);
        return [];
      }

      return (admins || []).map((admin) => ({
        userId: admin.id,
        email: admin.email,
        fullName: admin.full_name,
      }));
    } else if (recipient_mode === "ALL_USERS") {
      // Seleziona tutti gli utenti attivi con email valida
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("is_active", true)
        .not("email", "is", null);

      if (error) {
        console.error("[RecipientsResolver] Error fetching users:", error.message);
        return [];
      }

      return (users || []).map((user) => ({
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
      }));
    } else if (recipient_mode === "MANUAL" && manual_recipient_ids?.length) {
      // Seleziona utenti specifici
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", manual_recipient_ids)
        .eq("is_active", true)
        .not("email", "is", null);

      if (error) {
        console.error("[RecipientsResolver] Error fetching manual recipients:", error.message);
        return [];
      }

      return (users || []).map((user) => ({
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
      }));
    }

    return [];
  } catch (error) {
    console.error("[RecipientsResolver] Unexpected error:", error);
    return [];
  }
}

export async function deduplicateRecipients(recipients: Recipient[]): Promise<Recipient[]> {
  const seen = new Set<string>();
  return recipients.filter((r) => {
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
}
