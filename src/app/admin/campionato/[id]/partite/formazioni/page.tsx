import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import FormazioniClient from "@/components/admin-formazioni-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ squadra?: string; partita?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminFormazioniPage({ params, searchParams }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  const { id: championshipId } = await params;
  const { squadra: selectedTeamId, partita: selectedMatchId } = await searchParams;

  // Use admin client to bypass RLS
  const admin = createAdminClient();
  const dbClient = admin || supabase;

  // Recupera campionato
  const { data: championship, error: champError } = await dbClient
    .from("championships")
    .select("*")
    .eq("id", championshipId)
    .single();

  if (champError || !championship) {
    notFound();
  }

  // Recupera squadre del campionato
  const { data: teams } = await dbClient
    .from("championship_teams")
    .select("*")
    .eq("championship_id", championshipId)
    .eq("status", "active")
    .order("name");

  // Recupera partite del campionato (sempre tutte)
  const { data: allMatches } = await dbClient
    .from("championship_matches")
    .select("*")
    .eq("championship_id", championshipId)
    .order("scheduled_start_at", { ascending: false });

  const matches = allMatches || [];

  // Recupera giocatori della squadra selezionata (richiede sia partita che squadra)
  let players: any[] = [];

  if (selectedMatchId && selectedTeamId) {
    const { data: playersData } = await dbClient
      .from("championship_team_players")
      .select("*")
      .eq("team_id", selectedTeamId)
      .eq("status", "active");

    // Arricchisci con dati profili
    if (playersData && playersData.length > 0) {
      const userIds = playersData.map((p) => p.user_id);
      const { data: profilesData } = await dbClient
        .from("profiles")
        .select("id, full_name");

      players = playersData.map((p) => {
        const profile = profilesData?.find((pr) => pr.id === p.user_id);
        return {
          ...p,
          full_name: profile?.full_name || "—",
        };
      });
    }
  }

  // Recupera presenze per la partita selezionata
  let attendances: any[] = [];
  if (selectedMatchId && selectedTeamId) {
    const { data: attendanceData } = await dbClient
      .from("championship_match_attendances")
      .select("*")
      .eq("match_id", selectedMatchId)
      .in("user_id", players.map((p) => p.user_id));

    attendances = attendanceData || [];
  }

  const selectedTeam = teams?.find((t: any) => t.id === selectedTeamId);
  const selectedMatch = matches.find((m: any) => m.id === selectedMatchId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/admin/campionato/${championshipId}/partite`}
          className="text-blue-600 hover:underline"
        >
          ← Torna alle partite
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Gestione Formazioni</h1>
        <p className="text-gray-600 mt-1">{championship.name}</p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto whitespace-nowrap">
        <Link href={`/admin/campionato/${championshipId}`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          Dettagli
        </Link>
        <Link href={`/admin/campionato/${championshipId}/squadre`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          👥 Squadre
        </Link>
        <Link href={`/admin/campionato/${championshipId}/partite`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          🏓 Partite
        </Link>
        <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold whitespace-nowrap">
          👥 Formazioni
        </button>
      </div>

      <FormazioniClient
        championshipId={championshipId}
        teams={teams || []}
        matches={matches}
        players={players}
        attendances={attendances}
        selectedTeamId={selectedTeamId}
        selectedMatchId={selectedMatchId}
        selectedTeam={selectedTeam}
        selectedMatch={selectedMatch}
      />
    </div>
  );
}
