import type { SupabaseClient } from "@supabase/supabase-js";
import type { Season } from "./types";

export const DEFAULT_CALENDAR_DAYS = 90;

/** Stagione attualmente attiva (is_current = true), se presente. */
export async function getCurrentSeason(
  supabase: SupabaseClient
): Promise<Season | null> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();
  return data ?? null;
}

export type CalendarVisibilityMode = "DAYS" | "NEXT_WEEK_FROM_SATURDAY";

/** Modalità di visibilità del calendario (impostazione admin) e giorni di anticipo.
 *  Torna i default se le impostazioni non esistono o hanno valori non validi. */
export async function getCalendarVisibility(
  supabase: SupabaseClient
): Promise<{ mode: CalendarVisibilityMode; days: number }> {
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["calendar_visibility_mode", "calendar_days_ahead"]);

  const values = new Map((data ?? []).map((row) => [row.key, row.value]));
  const n = Number(values.get("calendar_days_ahead"));

  return {
    mode:
      values.get("calendar_visibility_mode") === "NEXT_WEEK_FROM_SATURDAY"
        ? "NEXT_WEEK_FROM_SATURDAY"
        : "DAYS",
    days: Number.isInteger(n) && n >= 1 && n <= 365 ? n : DEFAULT_CALENDAR_DAYS,
  };
}

/** Campionato in corso (impostazione admin), se impostato. */
export async function getCurrentChampionshipId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "current_championship_id")
    .maybeSingle();
  return data?.value || null;
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
