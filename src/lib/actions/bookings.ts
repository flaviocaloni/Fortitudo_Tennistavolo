"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Prenota uno slot per una data. Capienza, ruolo e limite settimanale
 *  sono validati dai trigger del database. */
export async function bookSlot(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  const sessionDate = String(formData.get("session_date") ?? "");
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("bookings").insert({
    slot_id: slotId,
    user_id: user.id,
    session_date: sessionDate,
  });

  if (error) backWithError("/calendario", error.message);
  revalidatePath("/calendario");
  revalidatePath("/prenotazioni");
}

/** Cancella (stato -> cancelled) una propria prenotazione. */
export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const from = String(formData.get("from") ?? "/prenotazioni");
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq("id", bookingId)
    .eq("status", "active");

  if (error) backWithError(from, error.message);
  revalidatePath("/calendario");
  revalidatePath("/prenotazioni");
  revalidatePath("/admin/prenotazioni");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
