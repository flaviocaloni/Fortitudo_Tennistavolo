"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";

async function requireAdmin() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/calendario");
  return supabase;
}

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Crea uno slot ricorrente settimanale oppure extra/evento (con data). */
export async function createSlot(formData: FormData) {
  const supabase = await requireAdmin();

  const kind = String(formData.get("kind") ?? "recurring");
  const eventDate = String(formData.get("event_date") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  const seasonId = String(formData.get("season_id") ?? "");
  if (!seasonId) backWithError("/admin/slot", "Seleziona una stagione");
  if (kind === "recurring" && (!startDate || !endDate)) {
    backWithError("/admin/slot", "Data inizio e data fine sono obbligatorie per gli slot ricorrenti");
  }

  const payload = {
    title: String(formData.get("title") || "Allenamento"),
    weekday: kind === "event" ? null : Number(formData.get("weekday")),
    event_date: kind === "event" ? eventDate : null,
    start_date: kind === "recurring" ? startDate : null,
    end_date: kind === "recurring" ? endDate : null,
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
    audience: String(formData.get("audience") ?? "misto"),
    min_capacity: Number(formData.get("min_capacity") ?? 2),
    max_capacity: Number(formData.get("max_capacity") ?? 12),
    notes: String(formData.get("notes") ?? "") || null,
    season_id: seasonId,
  };

  const { error } = await supabase.from("training_slots").insert(payload);
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

/** Modifica tutti i campi di uno slot esistente (ricorrente o evento). */
export async function updateSlot(formData: FormData) {
  const supabase = await requireAdmin();

  const slotId = String(formData.get("slot_id"));
  const kind = String(formData.get("kind") ?? "recurring");
  const eventDate = String(formData.get("event_date") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  const seasonId = String(formData.get("season_id") ?? "");
  if (!seasonId) backWithError("/admin/slot", "Seleziona una stagione");
  if (kind === "recurring" && (!startDate || !endDate)) {
    backWithError("/admin/slot", "Data inizio e data fine sono obbligatorie per gli slot ricorrenti");
  }
  if (kind === "recurring" && endDate <= startDate) {
    backWithError("/admin/slot", "La data fine deve essere successiva alla data inizio");
  }

  const payload = {
    title: String(formData.get("title") || "Allenamento"),
    weekday: kind === "event" ? null : Number(formData.get("weekday")),
    event_date: kind === "event" ? eventDate : null,
    start_date: kind === "recurring" ? startDate : null,
    end_date: kind === "recurring" ? endDate : null,
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
    audience: String(formData.get("audience") ?? "misto"),
    min_capacity: Number(formData.get("min_capacity") ?? 2),
    max_capacity: Number(formData.get("max_capacity") ?? 12),
    notes: String(formData.get("notes") ?? "") || null,
    season_id: seasonId,
  };

  const { error } = await supabase.from("training_slots").update(payload).eq("id", slotId);
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

/** Modifica data inizio/fine di uno slot ricorrente esistente. */
export async function updateSlotDates(formData: FormData) {
  const supabase = await requireAdmin();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!startDate || !endDate) {
    backWithError("/admin/slot", "Data inizio e data fine sono obbligatorie");
  }
  if (endDate <= startDate) {
    backWithError("/admin/slot", "La data fine deve essere successiva alla data inizio");
  }

  const { error } = await supabase
    .from("training_slots")
    .update({ start_date: startDate, end_date: endDate })
    .eq("id", String(formData.get("slot_id")));
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

export async function toggleSlotActive(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("training_slots")
    .update({ is_active: formData.get("is_active") === "true" })
    .eq("id", String(formData.get("slot_id")));
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

export async function deleteSlot(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("training_slots")
    .delete()
    .eq("id", String(formData.get("slot_id")));
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

/** Aggiorna la finestra di visibilità del calendario (giorni). */
export async function updateCalendarDays(formData: FormData) {
  const supabase = await requireAdmin();
  const days = Number(formData.get("days"));
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    backWithError("/admin/slot", "Valore non valido: inserire un numero di giorni tra 1 e 365");
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "calendar_days_ahead", value: String(days), updated_at: new Date().toISOString() });

  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

/** Aggiunge un periodo di chiusura del centro. */
export async function createClosure(formData: FormData) {
  const supabase = await requireAdmin();
  const start = String(formData.get("start_date"));
  const { error } = await supabase.from("club_closures").insert({
    start_date: start,
    end_date: String(formData.get("end_date") || start),
    reason: String(formData.get("reason") || "Chiusura"),
  });
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

export async function deleteClosure(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("club_closures")
    .delete()
    .eq("id", String(formData.get("closure_id")));
  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}

/** L'admin cancella la prenotazione di qualsiasi utente. */
export async function adminCancelBooking(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/calendario");

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user!.id,
    })
    .eq("id", String(formData.get("booking_id")))
    .eq("status", "active");

  if (error) backWithError("/admin/prenotazioni", error.message);
  revalidatePath("/admin/prenotazioni");
  revalidatePath("/calendario");
}

/** Attiva/disattiva Google OAuth. */
export async function toggleGoogleOAuth(formData: FormData) {
  const supabase = await requireAdmin();
  const enabled = String(formData.get("enabled") ?? "false") === "true";

  const { error } = await supabase
    .from("app_settings")
    .upsert({
      key: "google_oauth_enabled",
      value: enabled ? "true" : "false",
    });

  if (error) backWithError("/admin/slot", error.message);
  revalidatePath("/admin/slot");
  revalidatePath("/login");
}
