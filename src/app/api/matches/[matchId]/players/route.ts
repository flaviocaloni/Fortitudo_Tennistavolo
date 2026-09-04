import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = await createClient();
    const { matchId } = await params;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    // Fetch match to get team_id
    const { data: match, error: matchError } = await supabase
      .from("championship_matches")
      .select("team_id")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Fetch players with attendance status
    const { data: attendances, error: attendancesError } = await supabase
      .from("championship_match_attendances")
      .select(
        `
        id,
        user_id,
        status,
        profiles!inner(id, full_name)
      `
      )
      .eq("match_id", matchId)
      .order("profiles(full_name)", { ascending: true });

    if (attendancesError) {
      console.error("Error fetching attendances:", attendancesError);
      return NextResponse.json(
        { error: "Failed to fetch attendances" },
        { status: 500 }
      );
    }

    // Transform response
    const players = (attendances || []).map((a: any) => ({
      id: a.profiles.id,
      full_name: a.profiles.full_name,
      attendanceId: a.id,
      status: a.status,
    }));

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
