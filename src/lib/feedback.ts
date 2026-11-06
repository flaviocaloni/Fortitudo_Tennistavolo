import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackCategory = "BUG" | "UNEXPECTED" | "SUGGESTION" | "OTHER";
export type FeedbackStatus = "NEW" | "REVIEWED" | "RESOLVED" | "DISMISSED";
export type FeedbackTelegramMode = "OFF" | "NEGATIVE" | "ALL";

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  BUG: "Bug",
  UNEXPECTED: "Risultato inatteso",
  SUGGESTION: "Suggerimento",
  OTHER: "Altro",
};

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  NEW: "Nuovo",
  REVIEWED: "Visto",
  RESOLVED: "Risolto",
  DISMISSED: "Archiviato",
};

export const FEEDBACK_MAX_PER_HOUR = 10;
export const UNEXPECTED_THRESHOLD = 3;

const BUG_KEYWORDS = [
  "errore", "non funziona", "non va", "bug", "bianco", "invalid", "500",
  "rotto", "crash", "non si carica", "non carica", "sbagliat",
];

export interface FeedbackSettings {
  enabled: boolean;
  telegram: FeedbackTelegramMode;
}

export async function getFeedbackSettings(supabase: SupabaseClient): Promise<FeedbackSettings> {
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["feedback_enabled", "feedback_telegram"]);

  const values = new Map((data ?? []).map((row) => [row.key, row.value]));
  const telegram = values.get("feedback_telegram");

  return {
    enabled: values.get("feedback_enabled") === "true",
    telegram: telegram === "OFF" || telegram === "ALL" ? telegram : "NEGATIVE",
  };
}

export function looksLikeBug(note: string | null | undefined): boolean {
  if (!note) return false;
  const text = note.toLowerCase();
  return BUG_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
