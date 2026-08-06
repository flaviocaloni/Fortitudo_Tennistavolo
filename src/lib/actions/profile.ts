"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";

/** L'utente aggiorna il proprio nome (ruolo e limite restano admin-only). */
export async function updateOwnName(formData: FormData) {
  const { supabase, user } = await getSessionProfile();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) {
    redirect(`/profilo?error=${encodeURIComponent("Il nome non può essere vuoto")}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) redirect(`/profilo?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/profilo");
  revalidatePath("/", "layout"); // aggiorna il nome nella navbar
  redirect(`/profilo?ok=${encodeURIComponent("Nome aggiornato")}`);
}

/** L'utente aggiorna la data di scadenza del certificato medico. */
export async function updateMedicalCertificate(formData: FormData) {
  const { supabase, user } = await getSessionProfile();
  if (!user) redirect("/login");

  const expiryDate = String(formData.get("medical_certificate_expiry") ?? "").trim();
  if (!expiryDate) {
    redirect(`/profilo?error=${encodeURIComponent("La data non può essere vuota")}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ medical_certificate_expiry: expiryDate })
    .eq("id", user.id);

  if (error) redirect(`/profilo?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/profilo");
  revalidatePath("/statistiche");
  redirect(`/profilo?ok=${encodeURIComponent("Certificato medico aggiornato")}`);
}
