"use server";

import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/utils/roles";

async function requireSuperAdmin() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isSuperAdmin(profile.role)) redirect("/calendario");
  return { supabase, profile };
}

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Superadmin toggles auto-booking feature for a user */
export async function toggleUserAutoBooking(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";

  if (!userId) {
    backWithError("/sys/auto-booking", "User ID is required");
  }

  // First, check if record exists
  const { data: existing } = await supabase
    .from("user_auto_booking_enabled")
    .select("id")
    .eq("user_id", userId)
    .single();

  let error;

  if (existing) {
    // Update existing record
    const result = await supabase
      .from("user_auto_booking_enabled")
      .update({ auto_booking_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    error = result.error;
  } else {
    // Create new record
    const result = await supabase
      .from("user_auto_booking_enabled")
      .insert({ user_id: userId, auto_booking_enabled: enabled });
    error = result.error;
  }

  if (error) {
    backWithError("/sys/auto-booking", error.message);
  }

  // Revalidate after update
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/sys/auto-booking");
}

/** User toggles auto-booking for a specific slot */
export async function toggleSlotAutoBooking(formData: FormData) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user has auto-booking enabled
  const { data: autoBookingStatus } = await supabase
    .from("user_auto_booking_enabled")
    .select("auto_booking_enabled")
    .eq("user_id", profile.id)
    .single();

  if (!autoBookingStatus?.auto_booking_enabled) {
    backWithError("/calendario/auto-booking", "Auto-booking feature not enabled for this user");
  }

  const slotId = String(formData.get("slot_id") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";

  if (!slotId) {
    backWithError("/calendario/auto-booking", "Slot ID is required");
  }

  // Check if record exists
  const { data: existing } = await supabase
    .from("user_slot_auto_booking")
    .select("id")
    .eq("user_id", profile.id)
    .eq("slot_id", slotId)
    .single();

  let error;

  if (existing) {
    // Update existing record
    const result = await supabase
      .from("user_slot_auto_booking")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .eq("slot_id", slotId);
    error = result.error;
  } else {
    // Create new record
    const result = await supabase
      .from("user_slot_auto_booking")
      .insert({
        user_id: profile.id,
        slot_id: slotId,
        enabled,
      });
    error = result.error;
  }

  if (error) {
    backWithError("/calendario/auto-booking", error.message);
  }

  // Revalidate after update
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/calendario/auto-booking");
  revalidatePath("/calendario");
}
