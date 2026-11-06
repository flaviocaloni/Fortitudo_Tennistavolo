"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";
import { sendFeedbackToTelegram } from "@/lib/services/telegram-sender";
import {
  FEEDBACK_MAX_PER_HOUR,
  escapeHtml,
  getFeedbackSettings,
  type FeedbackCategory,
  type FeedbackStatus,
  type FeedbackTelegramMode,
} from "@/lib/feedback";

export interface FeedbackActionResult {
  ok: boolean;
  error?: string;
}

const CATEGORIES: FeedbackCategory[] = ["BUG", "UNEXPECTED", "SUGGESTION", "OTHER"];
const STATUSES: FeedbackStatus[] = ["NEW", "REVIEWED", "RESOLVED", "DISMISSED"];
const TELEGRAM_MODES: FeedbackTelegramMode[] = ["OFF", "NEGATIVE", "ALL"];

export async function submitFeedback(formData: FormData): Promise<FeedbackActionResult> {
  const { supabase, user } = await getSessionProfile();
  if (!user) return { ok: false, error: "Devi essere loggato per inviare un feedback" };

  const settings = await getFeedbackSettings(supabase);
  if (!settings.enabled) return { ok: false, error: "Il feedback non è attivo" };

  const rating = Number(formData.get("rating"));
  if (rating !== 1 && rating !== -1) return { ok: false, error: "Scegli pollice su o giù" };

  const pagePath = String(formData.get("page_path") ?? "");
  if (!pagePath.startsWith("/") || pagePath.length > 300) {
    return { ok: false, error: "Pagina non valida" };
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= FEEDBACK_MAX_PER_HOUR) {
    return { ok: false, error: "Hai inviato troppi feedback nell'ultima ora, riprova più tardi" };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    page_path: pagePath,
    rating,
    note,
  });
  if (error) return { ok: false, error: "Errore durante l'invio, riprova" };

  const shouldNotify =
    settings.telegram === "ALL" || (settings.telegram === "NEGATIVE" && rating === -1);
  if (shouldNotify) {
    const message =
      `💬 <b>Nuovo feedback</b>\n` +
      `Pagina: <code>${escapeHtml(pagePath)}</code>\n` +
      `Voto: ${rating === 1 ? "👍" : "👎"}\n` +
      `Utente: #${escapeHtml(user.id.slice(0, 8))}` +
      (note ? `\n\n${escapeHtml(note)}` : "");
    await sendFeedbackToTelegram(message);
  }

  return { ok: true };
}

async function requireAdminSession() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile || !isAdmin(profile.role)) return null;
  return { supabase, user };
}

export async function replyToFeedback(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  if (!session) redirect("/calendario");

  const feedbackId = String(formData.get("feedback_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);
  if (!feedbackId || body.length === 0) {
    redirect(`/admin/feedback?error=${encodeURIComponent("Scrivi una risposta")}`);
  }

  const { error } = await session.supabase.from("feedback_replies").insert({
    feedback_id: feedbackId,
    author_id: session.user.id,
    body,
  });
  if (error) redirect(`/admin/feedback?error=${encodeURIComponent(error.message)}`);

  await session.supabase
    .from("feedback")
    .update({ status: "REVIEWED", reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
    .eq("id", feedbackId)
    .eq("status", "NEW");

  revalidatePath("/admin/feedback");
  revalidatePath("/feedback");
}

export async function updateFeedback(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  if (!session) redirect("/calendario");

  const feedbackId = String(formData.get("feedback_id") ?? "");
  const status = String(formData.get("status") ?? "") as FeedbackStatus;
  const categoryRaw = String(formData.get("category") ?? "");
  const category = CATEGORIES.includes(categoryRaw as FeedbackCategory)
    ? (categoryRaw as FeedbackCategory)
    : null;
  const adminNote = String(formData.get("admin_note") ?? "").trim().slice(0, 1000) || null;

  if (!feedbackId || !STATUSES.includes(status)) {
    redirect(`/admin/feedback?error=${encodeURIComponent("Dati non validi")}`);
  }

  const { error } = await session.supabase
    .from("feedback")
    .update({
      status,
      category,
      admin_note: adminNote,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", feedbackId);
  if (error) redirect(`/admin/feedback?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/feedback");
}

export async function updateFeedbackSettings(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  if (!session) redirect("/calendario");

  const enabled = formData.get("enabled") === "on";
  const telegramRaw = String(formData.get("telegram") ?? "");
  const telegram = TELEGRAM_MODES.includes(telegramRaw as FeedbackTelegramMode)
    ? telegramRaw
    : "NEGATIVE";

  const updatedAt = new Date().toISOString();
  const { error } = await session.supabase.from("app_settings").upsert([
    { key: "feedback_enabled", value: String(enabled), updated_at: updatedAt },
    { key: "feedback_telegram", value: telegram, updated_at: updatedAt },
  ]);
  if (error) redirect(`/admin/feedback/configurazione?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/feedback/configurazione");
  revalidatePath("/", "layout");
  redirect("/admin/feedback/configurazione?success=1");
}
