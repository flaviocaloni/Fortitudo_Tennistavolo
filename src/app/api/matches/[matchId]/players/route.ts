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

    // Fetch attendances (without complex join)
    const { data: attendances, error: attendancesError } = await supabase
      .from("championship_match_attendances")
      .select("id, user_id, status")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (attendancesError) {
      console.error("Error fetching attendances:", attendancesError);
      return NextResponse.json(
        { error: "Failed to fetch attendances" },
        { status: 500 }
      );
    }

    // Fetch team players
    const { data: teamPlayers, error: playersError } = await supabase
      .from("championship_team_players")
      .select("user_id")
      .eq("team_id", match.team_id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (playersError) {
      console.error("Error fetching team players:", playersError);
      return NextResponse.json(
        { error: "Failed to fetch players" },
        { status: 500 }
      );
    }

    // Collect all user IDs
    const allUserIds = new Set([
      ...(attendances || []).map((a: any) => a.user_id),
      ...(teamPlayers || []).map((tp: any) => tp.user_id),
    ]);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(allUserIds));

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    // Build maps
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
    const attendanceMap = new Map(attendances?.map((a: any) => [a.user_id, a]) || []);

    // Combine: attendances first, then team players not in attendance
    const players: any[] = [];
    const processedUserIds = new Set();

    // Add attendances
    (attendances || []).forEach((att: any) => {
      const profile = profileMap.get(att.user_id);
      if (profile) {
        players.push({
          id: profile.id,
          full_name: profile.full_name,
          attendanceId: att.id,
          status: att.status,
        });
        processedUserIds.add(att.user_id);
      }
    });

    // Add team players not in attendance
    (teamPlayers || []).forEach((tp: any) => {
      if (!processedUserIds.has(tp.user_id)) {
        const profile = profileMap.get(tp.user_id);
        if (profile) {
          players.push({
            id: profile.id,
            full_name: profile.full_name,
            attendanceId: null,
            status: "PRESENT",
          });
          processedUserIds.add(tp.user_id);
        }
      }
    });

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
