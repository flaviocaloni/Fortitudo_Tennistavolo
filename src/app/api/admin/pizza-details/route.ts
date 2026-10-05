import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";
import { getPizzaSlotDetails } from "@/lib/supabase/pizza-stats";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { profile, supabase } = await getSessionProfile();

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const searchName = searchParams.get("name") || undefined;
    const searchDate = searchParams.get("date") || undefined;

    const slots = await getPizzaSlotDetails(supabase, searchName || undefined, searchDate || undefined);

    return NextResponse.json(slots);
  } catch (error) {
    console.error("[pizza-details API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
