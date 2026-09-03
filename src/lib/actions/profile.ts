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
