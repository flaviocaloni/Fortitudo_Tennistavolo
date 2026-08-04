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

  const payload = {
    title: String(formData.get("title") || "Allenamento"),
    weekday: kind === "event" ? null : Number(formData.get("weekday")),
    event_date: kind === "event" ? eventDate : null,
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
    audience: String(formData.get("audience") ?? "misto"),
    min_capacity: Number(formData.get("min_capacity") ?? 2),
    max_capacity: Number(formData.get("max_capacity") ?? 12),
    notes: String(formData.get("notes") ?? "") || null,
  };

  const { error } = await supabase.from("training_slots").insert(payload);
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

/** Aggiorna ruolo e limite settimanale di un utente. */
export async function updateUser(formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({
      role: String(formData.get("role")),
      weekly_limit: Number(formData.get("weekly_limit")),
    })
    .eq("id", String(formData.get("user_id")));

  if (error) backWithError("/admin/utenti", error.message);
  revalidatePath("/admin/utenti");
}
