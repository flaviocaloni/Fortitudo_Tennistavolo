import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";
import { NextRequest, NextResponse } from "next/server";

interface BookingDetail {
  id: string;
  user_name: string;
  user_email: string;
  session_date: string;
  selected_participants: number;
  slot_title: string;
  start_time: string;
  end_time: string;
}

export async function GET(request: NextRequest) {
  try {
    const { profile, supabase } = await getSessionProfile();

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const searchName = searchParams.get("name") || undefined;
    const searchDate = searchParams.get("date") || undefined;

    // Ottieni slot pizza che corrispondono ai filtri
    let slotQuery = supabase
      .from("training_slots")
      .select("id")
      .not("pizza_date", "is", null);

    if (searchName) {
      slotQuery = slotQuery.ilike("title", `%${searchName}%`);
    }

    if (searchDate) {
      slotQuery = slotQuery.eq("pizza_date", searchDate);
    }

    const { data: pizzaSlots } = await slotQuery;
    const slotIds = (pizzaSlots || []).map((s: any) => s.id);

    if (slotIds.length === 0) {
      return NextResponse.json([]);
    }

    // Ottieni prenotazioni per questi slot
    const { data: bookings } = await supabase
      .from("bookings")
      .select(
        `
        id,
        session_date,
        selected_participants,
        slot_id,
        user_id,
        profiles:user_id(full_name, email),
        training_slots:slot_id(title, start_time, end_time)
      `
      )
      .eq("status", "active")
      .in("slot_id", slotIds)
      .order("session_date", { ascending: false });

    const result: BookingDetail[] = (bookings || []).map((b: any) => ({
      id: b.id,
      user_name: b.profiles?.full_name || "Sconosciuto",
      user_email: b.profiles?.email || "",
      session_date: b.session_date,
      selected_participants: b.selected_participants || 1,
      slot_title: b.training_slots?.title || "",
      start_time: b.training_slots?.start_time || "",
      end_time: b.training_slots?.end_time || "",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[pizza-bookings API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
