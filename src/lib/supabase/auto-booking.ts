import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAutoBookingEnabled(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_auto_booking_enabled")
    .select("auto_booking_enabled")
    .eq("user_id", userId)
    .single();

  return data?.auto_booking_enabled ?? false;
}

export async function getUserSlotAutoBookings(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ id: string; slot_id: string; enabled: boolean }>> {
  const { data } = await supabase
    .from("user_slot_auto_booking")
    .select("id, slot_id, enabled")
    .eq("user_id", userId);

  return data ?? [];
}

export async function getRecurringSlots(
  supabase: SupabaseClient,
  seasonId: string
): Promise<
  Array<{
    id: string;
    title: string;
    weekday: number;
    start_time: string;
    end_time: string;
    audience: string;
  }>
> {
  const { data } = await supabase
    .from("training_slots")
    .select("id, title, weekday, start_time, end_time, audience")
    .eq("season_id", seasonId)
    .not("weekday", "is", null)
    .eq("is_active", true)
    .order("weekday, start_time");

  return data ?? [];
}

export async function getAllUsersWithAutoBooking(
  supabase: SupabaseClient
): Promise<Array<{ user_id: string; auto_booking_enabled: boolean }>> {
  const { data } = await supabase
    .from("user_auto_booking_enabled")
    .select("user_id, auto_booking_enabled");

  return data ?? [];
}

export async function getProfilesByIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Array<{ id: string; full_name: string; email?: string }>> {
  if (userIds.length === 0) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  return data ?? [];
}
