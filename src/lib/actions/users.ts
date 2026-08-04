"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE = "/admin/utenti";

async function requireAdminWithService() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/calendario");
  const admin = createAdminClient();
  if (!admin) {
    redirect(
      `${PAGE}?error=${encodeURIComponent(
        "SUPABASE_SERVICE_ROLE_KEY non configurata: questa operazione non è disponibile."
      )}`
    );
  }
  return { supabase, admin: admin! };
}

function backWithError(message: string): never {
  redirect(`${PAGE}?error=${encodeURIComponent(message)}`);
}

function backWithOk(message: string): never {
  redirect(`${PAGE}?ok=${encodeURIComponent(message)}`);
}

/** Registra un nuovo utente (email già confermata, entra subito). */
export async function adminCreateUser(formData: FormData) {
  const { admin } = await requireAdminWithService();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) {
    backWithError("Email e password (min 6 caratteri) sono obbligatorie");
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: String(formData.get("full_name") ?? ""),
      role: String(formData.get("role") ?? "amatore"),
      weekly_limit: String(formData.get("weekly_limit") ?? "1"),
    },
  });

  if (error) backWithError(error.message);
  revalidatePath(PAGE);
  backWithOk(`Utente ${email} creato`);
}

/** Aggiorna dati di registrazione: nome, email, ruolo, limite settimanale. */
export async function adminUpdateUser(formData: FormData) {
  const { supabase, admin } = await requireAdminWithService();
  const userId = String(formData.get("user_id"));
  const email = String(formData.get("email") ?? "").trim();

  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? ""),
      role: String(formData.get("role")),
      weekly_limit: Number(formData.get("weekly_limit")),
    })
    .eq("id", userId);
  if (profErr) backWithError(profErr.message);

  if (email) {
    const { error: mailErr } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (mailErr) backWithError(mailErr.message);
  }

  revalidatePath(PAGE);
  backWithOk("Dati aggiornati");
}

/** Invia all'utente l'email di reset password. */
export async function adminSendPasswordReset(formData: FormData) {
  const { supabase } = await requireAdminWithService();
  const email = String(formData.get("email"));

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/account/password`,
  });

  if (error) backWithError(error.message);
  backWithOk(`Email di reset inviata a ${email}`);
}

/** Forza una nuova password di accesso per l'utente. */
export async function adminSetPassword(formData: FormData) {
  const { admin } = await requireAdminWithService();
  const userId = String(formData.get("user_id"));
  const password = String(formData.get("new_password") ?? "");

  if (password.length < 6) {
    backWithError("La password deve avere almeno 6 caratteri");
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) backWithError(error.message);
  backWithOk("Password aggiornata");
}
