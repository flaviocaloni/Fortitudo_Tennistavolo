import { SupabaseClient } from "@supabase/supabase-js";
import {
  Championship,
  ChampionshipTeam,
  ChampionshipTeamPlayer,
  ChampionshipMatch,
  ChampionshipMatchAttendance,
  ChampionshipAttendanceHistory,
} from "@/lib/types";

// ============ CHAMPIONSHIPS ============

export async function getChampionshipsBySeasonId(
  supabase: SupabaseClient,
  seasonId: string
) {
  return supabase
    .from("championships")
    .select("*")
    .eq("season_id", seasonId)
    .order("created_at", { ascending: false });
}

export async function getChampionshipById(
  supabase: SupabaseClient,
  championshipId: string
) {
  return supabase
    .from("championships")
    .select("*")
    .eq("id", championshipId)
    .single();
}

export async function createChampionship(
  supabase: SupabaseClient,
  payload: {
    season_id: string;
    name: string;
    status?: string;
    created_by_user_id?: string;
  }
) {
  return supabase
    .from("championships")
    .insert([
      {
        ...payload,
        status: payload.status || "draft",
      },
    ])
    .select()
    .single();
}

export async function updateChampionship(
  supabase: SupabaseClient,
  championshipId: string,
  payload: Partial<Championship>
) {
  return supabase
    .from("championships")
    .update(payload)
    .eq("id", championshipId)
    .select()
    .single();
}

export async function deleteChampionship(
  supabase: SupabaseClient,
  championshipId: string
) {
  return supabase
    .from("championships")
    .delete()
    .eq("id", championshipId);
}

// ============ CHAMPIONSHIP TEAMS ============

export async function getTeamsByChampionshipId(
  supabase: SupabaseClient,
  championshipId: string
) {
  return supabase
    .from("championship_teams")
    .select("*")
    .eq("championship_id", championshipId)
    .eq("status", "active")
    .order("name", { ascending: true });
}

export async function getTeamById(
  supabase: SupabaseClient,
  teamId: string
) {
  return supabase
    .from("championship_teams")
    .select("*")
    .eq("id", teamId)
    .single();
}

export async function createTeam(
  supabase: SupabaseClient,
  payload: {
    championship_id: string;
    name: string;
    series: string;
    group_code: string;
    created_by_user_id?: string;
  }
) {
  return supabase
    .from("championship_teams")
    .insert([payload])
    .select()
    .single();
}

export async function updateTeam(
  supabase: SupabaseClient,
  teamId: string,
  payload: Partial<ChampionshipTeam>
) {
  return supabase
    .from("championship_teams")
    .update(payload)
    .eq("id", teamId)
    .select()
    .single();
}

export async function deleteTeam(
  supabase: SupabaseClient,
  teamId: string
) {
  return supabase
    .from("championship_teams")
    .delete()
    .eq("id", teamId);
}

// ============ CHAMPIONSHIP TEAM PLAYERS ============

export async function getPlayersByTeamId(
  supabase: SupabaseClient,
  teamId: string,
  includeInactive = false
) {
  let query = supabase
    .from("championship_team_players")
    .select("*")
    .eq("team_id", teamId);

  if (!includeInactive) {
    query = query.eq("status", "active");
  }

  return query.order("joined_at", { ascending: true });
}

export async function addPlayerToTeam(
  supabase: SupabaseClient,
  payload: {
    team_id: string;
    user_id: string;
    joined_at?: string;
    created_by_user_id?: string;
  }
) {
  return supabase
    .from("championship_team_players")
    .insert([
      {
        ...payload,
        joined_at: payload.joined_at || new Date().toISOString().split("T")[0],
        status: "active",
      },
    ])
    .select()
    .single();
}

export async function removePlayerFromTeam(
  supabase: SupabaseClient,
  playerId: string,
  leftAt?: string
) {
  return supabase
    .from("championship_team_players")
    .update({
      status: "left",
      left_at: leftAt || new Date().toISOString().split("T")[0],
    })
    .eq("id", playerId)
    .select()
    .single();
}

// ============ CHAMPIONSHIP MATCHES ============

export async function getMatchesByTeamId(
  supabase: SupabaseClient,
  teamId: string,
  filters?: {
    status?: string;
    futureOnly?: boolean;
  }
) {
  let query = supabase
    .from("championship_matches")
    .select("*")
    .eq("team_id", teamId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.futureOnly) {
    query = query.gt("scheduled_start_at", new Date().toISOString());
  }

  return query.order("scheduled_start_at", { ascending: true });
}

export async function getMatchesByChampionshipId(
  supabase: SupabaseClient,
  championshipId: string,
  filters?: {
    status?: string;
    futureOnly?: boolean;
  }
) {
  let query = supabase
    .from("championship_matches")
    .select("*")
    .eq("championship_id", championshipId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.futureOnly) {
    query = query.gt("scheduled_start_at", new Date().toISOString());
  }

  return query.order("scheduled_start_at", { ascending: true });
}

export async function getMatchById(
  supabase: SupabaseClient,
  matchId: string
) {
  return supabase
    .from("championship_matches")
    .select("*")
    .eq("id", matchId)
    .single();
}

export async function createMatch(
  supabase: SupabaseClient,
  payload: {
    championship_id: string;
    season_id: string;
    team_id: string;
    opponent_name: string;
    opponent_club_name?: string | null;
    leg_type: string;
    venue_type: string;
    scheduled_start_at: string;
    timezone?: string;
    venue_name?: string | null;
    address?: string | null;
    notes?: string | null;
    return_match_id?: string | null;
    created_by_user_id?: string;
  }
) {
  return supabase
    .from("championship_matches")
    .insert([
      {
        ...payload,
        status: "SCHEDULED",
        timezone: payload.timezone || "Europe/Rome",
      },
    ])
    .select()
    .single();
}

export async function updateMatch(
  supabase: SupabaseClient,
  matchId: string,
  payload: Partial<ChampionshipMatch>
) {
  return supabase
    .from("championship_matches")
    .update(payload)
    .eq("id", matchId)
    .select()
    .single();
}

export async function deleteMatch(
  supabase: SupabaseClient,
  matchId: string
) {
  return supabase
    .from("championship_matches")
    .delete()
    .eq("id", matchId);
}

// ============ CHAMPIONSHIP MATCH ATTENDANCES ============

export async function getAttendancesByMatchId(
  supabase: SupabaseClient,
  matchId: string
) {
  return supabase
    .from("championship_match_attendances")
    .select("*, profiles(id, full_name, role)")
    .eq("match_id", matchId)
    .order("status", { ascending: true })
    .then((res) => {
      if (res.error) return res;
      return {
        ...res,
        data: res.data?.map((att: any) => ({
          ...att,
          user: att.profiles,
        })),
      };
    });
}

export async function getAttendanceByMatchAndUser(
  supabase: SupabaseClient,
  matchId: string,
  userId: string
) {
  return supabase
    .from("championship_match_attendances")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .single();
}

export async function updateAttendance(
  supabase: SupabaseClient,
  attendanceId: string,
  payload: {
    status: string;
    changed_by_user_id?: string;
    change_source?: string;
  }
) {
  return supabase
    .from("championship_match_attendances")
    .update({
      ...payload,
      changed_at: new Date().toISOString(),
    })
    .eq("id", attendanceId)
    .select()
    .single();
}

export async function getAttendanceHistory(
  supabase: SupabaseClient,
  attendanceId: string
) {
  return supabase
    .from("championship_attendance_history")
    .select("*")
    .eq("attendance_id", attendanceId)
    .order("created_at", { ascending: false });
}

// ============ HELPER FUNCTIONS ============

export async function matchHasStarted(
  supabase: SupabaseClient,
  matchId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("match_has_started", {
    p_match_id: matchId,
  });

  if (error) {
    console.error("Error checking match start:", error);
    return false;
  }

  return data ?? false;
}

export async function getCountAttendanceByStatus(
  supabase: SupabaseClient,
  matchId: string
) {
  const { data, error } = await supabase
    .from("championship_match_attendances")
    .select("status")
    .eq("match_id", matchId);

  if (error) return { present: 0, absent: 0 };

  const result = { present: 0, absent: 0 };
  data?.forEach((row: any) => {
    if (row.status === "PRESENT") result.present += 1;
    if (row.status === "ABSENT") result.absent += 1;
  });

  return result;
}
