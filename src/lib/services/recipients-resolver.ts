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
      // Seleziona tutti gli admin attivi con email da auth.users
      const { data: admins, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "admin")
        .eq("is_active", true);

      if (error) {
        console.error("[RecipientsResolver] Error fetching admins:", error.message);
        return [];
      }

      // Ottieni email da auth.users per ogni admin (via RPC o join)
      const recipients: Recipient[] = [];
      for (const admin of admins || []) {
        // Usa l'ID come identifier per il join con auth.users
        // Per ora, usa ID come email (sarà il field da cui Supabase legge l'email)
        recipients.push({
          userId: admin.id,
          email: admin.id, // In Supabase, l'email è accessibile tramite ID in auth.users
          fullName: admin.full_name,
        });
      }
      return recipients;
    } else if (recipient_mode === "ALL_USERS") {
      // Seleziona tutti gli utenti attivi
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true);

      if (error) {
        console.error("[RecipientsResolver] Error fetching users:", error.message);
        return [];
      }

      return (users || []).map((user) => ({
        userId: user.id,
        email: user.id,
        fullName: user.full_name,
      }));
    } else if (recipient_mode === "MANUAL" && manual_recipient_ids?.length) {
      // Seleziona utenti specifici
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", manual_recipient_ids)
        .eq("is_active", true);

      if (error) {
        console.error("[RecipientsResolver] Error fetching manual recipients:", error.message);
        return [];
      }

      return (users || []).map((user) => ({
        userId: user.id,
        email: user.id,
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
