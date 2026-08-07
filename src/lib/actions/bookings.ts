"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Prenota uno slot per una data. Capienza, ruolo e limite settimanale
 *  sono validati dai trigger del database. */
export async function bookSlot(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  const sessionDate = String(formData.get("session_date") ?? "");
  const supabase = await createClient();

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
  redirect("/calendario");
}

/** Cancella (stato -> cancelled) una propria prenotazione.
 *  Amatori e agonisti non possono agire su prenotazioni passate: solo l'admin può. */
export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");
  const from = String(formData.get("from") ?? "/prenotazioni");
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  if (profile?.role !== "admin") {
    const { data: booking } = await supabase
      .from("bookings")
      .select("session_date")
      .eq("id", bookingId)
      .single();

    if (booking && booking.session_date < toISODate(new Date())) {
      backWithError(from, "Non puoi modificare una prenotazione passata");
    }
  }

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
  redirect(from);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
