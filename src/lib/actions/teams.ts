"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";

export async function deactivateTeam(formData: FormData) {
  const { profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) {
    redirect("/calendario");
  }

  const teamId = String(formData.get("teamId") ?? "");
  const championshipId = String(formData.get("championshipId") ?? "");

  if (!teamId || !championshipId) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=Dati mancanti`);
  }

  const admin = createAdminClient();
  const dbClient = admin || null;

  if (!dbClient) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=Admin client non disponibile`);
  }

  const { error } = await dbClient
    .from("championship_teams")
    .update({ status: "inactive" })
    .eq("id", teamId)
    .eq("championship_id", championshipId);

  if (error) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?success=Squadra disattivata`);
}

export async function addPlayerToTeam(formData: FormData) {
  const { profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) {
    redirect("/calendario");
  }

  const teamId = String(formData.get("teamId") ?? "");
  const championshipId = String(formData.get("championshipId") ?? "");
  const userId = String(formData.get("playerId") ?? "");

  if (!teamId || !championshipId || !userId) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=Dati mancanti`);
  }

  const admin = createAdminClient();
  const dbClient = admin || null;

  if (!dbClient) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=Admin client non disponibile`);
  }

  const { error } = await dbClient
    .from("championship_team_players")
    .insert([
      {
        team_id: teamId,
        user_id: userId,
        status: "active",
        joined_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?success=Giocatore aggiunto`);
}

export async function removePlayerFromTeam(formData: FormData) {
  const { profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) {
    redirect("/calendario");
  }

  const teamId = String(formData.get("teamId") ?? "");
  const championshipId = String(formData.get("championshipId") ?? "");
  const userId = String(formData.get("playerId") ?? "");

  if (!teamId || !championshipId || !userId) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=Dati mancanti`);
  }

  const admin = createAdminClient();
  const dbClient = admin || null;

  if (!dbClient) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=Admin client non disponibile`);
  }

  const { error } = await dbClient
    .from("championship_team_players")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/campionato/${championshipId}/squadre/${teamId}?success=Giocatore rimosso`);
}
