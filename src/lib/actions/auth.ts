"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/server";

/** Login via email/password lato server. */
export async function loginWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email e password sono obbligatori")}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/calendario");
}

/** Invia email di reset password per un dato indirizzo email. */
export async function sendPasswordResetEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(`/account/reset-password?error=${encodeURIComponent("Inserisci un email valida")}`);
  }

  const supabase = await createClient();

  // Usa VERCEL_URL se disponibile (Vercel lo inietta automaticamente)
  // Altrimenti fallback a localhost per development
  const siteUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/account/password`,
  });

  if (error) {
    redirect(`/account/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account/reset-password?sent=true");
}

/** Admin impersona un utente: salva il user_id in un cookie e redirect. */
export async function impersonateUser(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const { profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const cookieStore = await cookies();
  cookieStore.set("impersonating", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600,
  });

  redirect("/calendario");
}

/** Admin torna alla vista normaleпосле impersonificazione. */
export async function stopImpersonating() {
  const cookieStore = await cookies();
  cookieStore.delete("impersonating");
  redirect("/admin/utenti");
}
