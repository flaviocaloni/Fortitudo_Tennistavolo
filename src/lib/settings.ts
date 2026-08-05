import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_CALENDAR_DAYS = 90;

/** Giorni di calendario visibili/prenotabili (impostazione admin).
 *  Torna il default se la tabella non esiste ancora o il valore non è valido. */
export async function getCalendarDaysAhead(
  supabase: SupabaseClient
): Promise<number> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "calendar_days_ahead")
    .maybeSingle();

  const n = Number(data?.value);
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : DEFAULT_CALENDAR_DAYS;
}

/** Verifica se Google OAuth è abilitato (impostazione admin). */
export async function isGoogleOAuthEnabled(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "google_oauth_enabled")
    .maybeSingle();

  return data?.value === "true";
}
