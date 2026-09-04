"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import * as notifications from "@/lib/supabase/notifications";

// ============ AUTHORIZATION ============

async function requireAdmin() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/campionato");
  return supabase;
}

async function requireAgnosta() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "agonista") redirect("/campionato");
  return { supabase, profile };
}

async function requireAuthenticated() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile) redirect("/login");
  return { supabase, profile };
}

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// ============ CHAMPIONSHIP CRUD ============

export async function createChampionship(formData: FormData) {
  const supabase = await requireAdmin();

  const seasonId = String(formData.get("season_id") ?? "");
  const name = String(formData.get("name") ?? "");

  if (!seasonId) backWithError("/admin/campionato", "Stagione obbligatoria");
  if (!name || name.trim().length === 0) {
    backWithError("/admin/campionato", "Nome campionato obbligatorio");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.createChampionship(supabase, {
    season_id: seasonId,
    name: name.trim(),
    status: "draft",
    created_by_user_id: profile?.id,
  });

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function updateChampionship(formData: FormData) {
  const supabase = await requireAdmin();

  const championshipId = String(formData.get("championship_id"));
  const name = String(formData.get("name") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (!name || name.trim().length === 0) {
    backWithError("/admin/campionato", "Nome campionato obbligatorio");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.updateChampionship(
    supabase,
    championshipId,
    {
      name: name.trim(),
      status: status as any,
      updated_by_user_id: profile?.id,
    }
  );

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function deleteChampionship(formData: FormData) {
  const supabase = await requireAdmin();

  const championshipId = String(formData.get("championship_id"));

  const { error } = await championships.deleteChampionship(
    supabase,
    championshipId
  );

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

// ============ TEAM CRUD ============

export async function createTeam(formData: FormData) {
  const supabase = await requireAdmin();

  const championshipId = String(formData.get("championship_id"));
  const name = String(formData.get("name") ?? "");
  const series = String(formData.get("series") ?? "D3");
  const groupCode = String(formData.get("group_code") ?? "A");

  if (!championshipId) backWithError("/admin/campionato", "Campionato obbligatorio");
  if (!name || name.trim().length === 0) {
    backWithError("/admin/campionato", "Nome squadra obbligatorio");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.createTeam(supabase, {
    championship_id: championshipId,
    name: name.trim(),
    series,
    group_code: groupCode.toUpperCase(),
    created_by_user_id: profile?.id,
  });

  if (error) {
    if (error.message.includes("unique")) {
      backWithError("/admin/campionato", "Una squadra con questo nome esiste già");
    }
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function updateTeam(formData: FormData) {
  const supabase = await requireAdmin();

  const teamId = String(formData.get("team_id"));
  const name = String(formData.get("name") ?? "");
  const series = String(formData.get("series") ?? "D3");
  const groupCode = String(formData.get("group_code") ?? "A");

  if (!name || name.trim().length === 0) {
    backWithError("/admin/campionato", "Nome squadra obbligatorio");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.updateTeam(supabase, teamId, {
    name: name.trim(),
    series: series as any,
    group_code: groupCode.toUpperCase(),
    updated_by_user_id: profile?.id,
  } as any);

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function deleteTeam(formData: FormData) {
  const supabase = await requireAdmin();

  const teamId = String(formData.get("team_id"));

  const { error } = await championships.deleteTeam(supabase, teamId);

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

// ============ TEAM PLAYERS ============

export async function addPlayerToTeam(formData: FormData) {
  const supabase = await requireAdmin();

  const teamId = String(formData.get("team_id"));
  const userId = String(formData.get("user_id"));

  if (!teamId || !userId) {
    backWithError("/admin/campionato", "Squadra e giocatore obbligatori");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.addPlayerToTeam(supabase, {
    team_id: teamId,
    user_id: userId,
    created_by_user_id: profile?.id,
  });

  if (error) {
    if (error.message.includes("already")) {
      backWithError("/admin/campionato", "Questo agonista appartiene già a una squadra");
    }
    if (error.message.includes("agonista")) {
      backWithError("/admin/campionato", "Solo agonisti possono essere assegnati");
    }
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/admin/campionato/[id]");
  revalidatePath("/campionato");
}

export async function removePlayerFromTeam(formData: FormData) {
  const supabase = await requireAdmin();

  const playerId = String(formData.get("player_id"));

  if (!playerId) {
    backWithError("/admin/campionato", "Giocatore obbligatorio");
  }

  const { error } = await championships.removePlayerFromTeam(supabase, playerId);

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/admin/campionato/[id]");
  revalidatePath("/campionato");
}

// ============ MATCHES ============

export async function createMatch(formData: FormData) {
  const supabase = await requireAdmin();

  const championshipId = String(formData.get("championship_id"));
  const seasonId = String(formData.get("season_id"));
  const teamId = String(formData.get("team_id"));
  const opponentName = String(formData.get("opponent_name") ?? "");
  const opponentClubName = String(formData.get("opponent_club_name") ?? "") || null;
  const legType = String(formData.get("leg_type") ?? "SINGLE");
  const venueType = String(formData.get("venue_type") ?? "HOME");
  const scheduledStartAt = String(formData.get("scheduled_start_at") ?? "");
  const venueName = String(formData.get("venue_name") ?? "") || null;
  const address = String(formData.get("address") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || null;

  if (!championshipId || !seasonId || !teamId) {
    backWithError("/admin/campionato", "Campionato, stagione e squadra obbligatori");
  }
  if (!opponentName || opponentName.trim().length === 0) {
    backWithError("/admin/campionato", "Nome avversario obbligatorio");
  }
  if (!scheduledStartAt) {
    backWithError("/admin/campionato", "Data e ora della partita obbligatorie");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  // Se andata/ritorno, create two matches
  let matchIdFirst: string;

  if (legType === "FIRST_LEG" || legType === "RETURN_LEG") {
    // Crea prima partita
    const { data: firstMatch, error: error1 } = await championships.createMatch(
      supabase,
      {
        championship_id: championshipId,
        season_id: seasonId,
        team_id: teamId,
        opponent_name: opponentName.trim(),
        opponent_club_name: opponentClubName,
        leg_type: legType,
        venue_type: venueType,
        scheduled_start_at: scheduledStartAt,
        venue_name: venueName,
        address: address,
        notes: notes,
        created_by_user_id: profile?.id,
      }
    );

    if (error1) backWithError("/admin/campionato", error1.message);

    matchIdFirst = firstMatch.data?.id || "";
  } else {
    // Crea singola partita
    const { data: singleMatch, error: errorSingle } =
      await championships.createMatch(supabase, {
        championship_id: championshipId,
        season_id: seasonId,
        team_id: teamId,
        opponent_name: opponentName.trim(),
        opponent_club_name: opponentClubName,
        leg_type: "SINGLE",
        venue_type: venueType,
        scheduled_start_at: scheduledStartAt,
        venue_name: venueName,
        address: address,
        notes: notes,
        created_by_user_id: profile?.id,
      });

    if (errorSingle) backWithError("/admin/campionato", errorSingle.message);

    matchIdFirst = singleMatch.data?.id || "";
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function createReturnMatch(formData: FormData) {
  const supabase = await requireAdmin();

  const firstMatchId = String(formData.get("first_match_id"));
  const scheduledStartAtReturn = String(formData.get("scheduled_start_at") ?? "");
  const venueTypeReturn = String(formData.get("venue_type") ?? "AWAY");
  const venueNameReturn = String(formData.get("venue_name") ?? "") || null;
  const addressReturn = String(formData.get("address") ?? "") || null;

  if (!firstMatchId || !scheduledStartAtReturn) {
    backWithError("/admin/campionato", "Partita iniziale e data obbligatorie");
  }

  const { data: firstMatch, error: fetchError } = await championships.getMatchById(
    supabase,
    firstMatchId
  );

  if (fetchError || !firstMatch) {
    backWithError("/admin/campionato", "Partita non trovata");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  // Crea partita di ritorno con venue_type invertito
  const { data: returnMatch, error: createError } = await championships.createMatch(
    supabase,
    {
      championship_id: firstMatch.championship_id,
      season_id: firstMatch.season_id,
      team_id: firstMatch.team_id,
      opponent_name: firstMatch.opponent_name,
      opponent_club_name: firstMatch.opponent_club_name,
      leg_type: "RETURN_LEG",
      venue_type: venueTypeReturn,
      scheduled_start_at: scheduledStartAtReturn,
      venue_name: venueNameReturn,
      address: addressReturn,
      notes: firstMatch.notes,
      return_match_id: firstMatchId,
      created_by_user_id: profile?.id,
    }
  );

  if (createError) {
    backWithError("/admin/campionato", createError.message);
  }

  // Aggiorna prima partita con riferimento al ritorno
  await championships.updateMatch(supabase, firstMatchId, {
    return_match_id: returnMatch.data?.id,
  } as any);

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function updateMatch(formData: FormData) {
  const supabase = await requireAdmin();

  const matchId = String(formData.get("match_id"));
  const opponentName = String(formData.get("opponent_name") ?? "");
  const opponentClubName = String(formData.get("opponent_club_name") ?? "") || null;
  const scheduledStartAt = String(formData.get("scheduled_start_at") ?? "");
  const venueType = String(formData.get("venue_type") ?? "HOME");
  const venueName = String(formData.get("venue_name") ?? "") || null;
  const address = String(formData.get("address") ?? "") || null;
  const status = String(formData.get("status") ?? "SCHEDULED");
  const result = String(formData.get("result") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || null;

  if (!opponentName || opponentName.trim().length === 0) {
    backWithError("/admin/campionato", "Nome avversario obbligatorio");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.updateMatch(supabase, matchId, {
    opponent_name: opponentName.trim(),
    opponent_club_name: opponentClubName,
    scheduled_start_at: scheduledStartAt,
    venue_type: venueType as any,
    venue_name: venueName,
    address: address,
    status: status as any,
    result: result,
    notes: notes,
    updated_by_user_id: profile?.id,
  } as any);

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function deleteMatch(formData: FormData) {
  const supabase = await requireAdmin();

  const matchId = String(formData.get("match_id"));

  const { error } = await championships.deleteMatch(supabase, matchId);

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

// ============ ATTENDANCES ============

export async function updateAttendanceAsAdmin(formData: FormData) {
  const supabase = await requireAdmin();

  const attendanceId = String(formData.get("attendance_id"));
  const status = String(formData.get("status") ?? "PRESENT");

  if (!attendanceId || !["PRESENT", "ABSENT"].includes(status)) {
    backWithError("/admin/campionato", "Dati obbligatori non validi");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .single();

  const { error } = await championships.updateAttendance(supabase, attendanceId, {
    status,
    changed_by_user_id: profile?.id,
    change_source: "ADMIN",
  });

  if (error) {
    backWithError("/admin/campionato", error.message);
  }

  revalidatePath("/admin/campionato");
  revalidatePath("/campionato");
}

export async function updateMyAttendance(formData: FormData) {
  const { supabase, profile } = await requireAgnosta();

  const matchId = String(formData.get("match_id"));
  const status = String(formData.get("status") ?? "PRESENT");

  if (!matchId || !["PRESENT", "ABSENT"].includes(status)) {
    backWithError("/campionato", "Dati obbligatori non validi");
  }

  // Verifica se l'agonista appartiene alla squadra
  const { data: matchData, error: matchError } = await championships.getMatchById(
    supabase,
    matchId
  );

  if (matchError || !matchData) {
    backWithError("/campionato", "Partita non trovata");
  }

  // Verifica apparteneneza alla squadra
  const { data: playerData, error: playerError } = await supabase
    .from("championship_team_players")
    .select("id")
    .eq("team_id", matchData.team_id)
    .eq("user_id", profile.id)
    .eq("status", "active")
    .single();

  if (playerError || !playerData) {
    backWithError("/campionato", "Non sei membro di questa squadra");
  }

  // Verifica che la partita non sia iniziata
  const hasStarted = await championships.matchHasStarted(supabase, matchId);
  if (hasStarted) {
    backWithError("/campionato", "Non puoi modificare la presenza dopo l'inizio della partita");
  }

  // Recupera o crea attendance
  const { data: attendance, error: attendanceError } =
    await championships.getAttendanceByMatchAndUser(supabase, matchId, profile.id);

  if (attendanceError) {
    backWithError("/campionato", "Errore nel recupero della presenza");
  }

  if (!attendance) {
    // Crea nuova entrada (in caso di bug, ma di default dovrebbe esistere)
    const { error: createError } = await supabase
      .from("championship_match_attendances")
      .insert([
        {
          match_id: matchId,
          user_id: profile.id,
          status: status,
          changed_by_user_id: profile.id,
          change_source: "PLAYER",
        },
      ]);

    if (createError) {
      backWithError("/campionato", createError.message);
    }
  } else {
    // Aggiorna presence
    const { error: updateError } = await championships.updateAttendance(
      supabase,
      attendance.id,
      {
        status,
        changed_by_user_id: profile.id,
        change_source: "PLAYER",
      }
    );

    if (updateError) {
      backWithError("/campionato", updateError.message);
    }
  }

  revalidatePath("/campionato");
}
