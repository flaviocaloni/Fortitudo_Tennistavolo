"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";

const PAGE = "/admin/stagioni";

async function requireAdmin() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/calendario");
  return supabase;
}

function backWithError(message: string): never {
  redirect(`${PAGE}?error=${encodeURIComponent(message)}`);
}

/** Crea una nuova stagione. */
export async function adminCreateSeason(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!name || !startDate || !endDate) {
    backWithError("Nome, data inizio e data fine sono obbligatori");
  }
  if (endDate <= startDate) {
    backWithError("La data fine deve essere successiva alla data inizio");
  }

  const { error } = await supabase.from("seasons").insert({
    name,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) backWithError(error.message);
  revalidatePath(PAGE);
  revalidatePath("/calendario");
}

/** Modifica nome/date di una stagione esistente. */
export async function adminUpdateSeason(formData: FormData) {
  const supabase = await requireAdmin();

  const seasonId = String(formData.get("season_id"));
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!name || !startDate || !endDate) {
    backWithError("Nome, data inizio e data fine sono obbligatori");
  }
  if (endDate <= startDate) {
    backWithError("La data fine deve essere successiva alla data inizio");
  }

  const { error } = await supabase
    .from("seasons")
    .update({ name, start_date: startDate, end_date: endDate })
    .eq("id", seasonId);

  if (error) backWithError(error.message);
  revalidatePath(PAGE);
  revalidatePath("/calendario");
}

/** Imposta una stagione come corrente (le altre tornano non-correnti). */
export async function adminSetCurrentSeason(formData: FormData) {
  const supabase = await requireAdmin();
  const seasonId = String(formData.get("season_id"));

  const { error: clearErr } = await supabase
    .from("seasons")
    .update({ is_current: false })
    .eq("is_current", true);
  if (clearErr) backWithError(clearErr.message);

  const { error } = await supabase
    .from("seasons")
    .update({ is_current: true })
    .eq("id", seasonId);
  if (error) backWithError(error.message);

  revalidatePath(PAGE);
  revalidatePath("/admin/slot");
  revalidatePath("/calendario");
}
