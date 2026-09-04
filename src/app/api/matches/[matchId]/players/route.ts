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

    // Fetch players for this team
    const { data: teamPlayers, error: playersError } = await supabase
      .from("championship_team_players")
      .select(
        `
        user_id,
        profiles!inner(id, full_name)
      `
      )
      .eq("team_id", match.team_id)
      .eq("status", "active");

    if (playersError) {
      console.error("Error fetching players:", playersError);
      return NextResponse.json(
        { error: "Failed to fetch players" },
        { status: 500 }
      );
    }

    // Transform response
    const players = (teamPlayers || []).map((tp: any) => ({
      id: tp.profiles.id,
      full_name: tp.profiles.full_name,
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
