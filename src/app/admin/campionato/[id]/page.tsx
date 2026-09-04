import { notFound, redirect } from "next/navigation";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import {
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/lib/actions/championships";
import ConfirmDeleteButton from "@/components/confirm-delete-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminChampionatoDetailPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/campionato");
  }

  const { id: championshipId } = await params;

  // Recupera campionato
  const { data: championship, error: champError } =
    await championships.getChampionshipById(supabase, championshipId);

  if (champError || !championship) {
    notFound();
  }

  // Recupera squadre
  const { data: teams } = await championships.getTeamsByChampionshipId(
    supabase,
    championshipId
  );

  // Recupera giocatori per ogni squadra (con workaround RLS)
  const teamPlayersMap = new Map();
  if (teams?.length) {
    for (const team of teams) {
      // Query 1: giocatori della squadra
      const { data: players, error: playersError } = await championships.getPlayersByTeamId(
        supabase,
        team.id
      );
      if (playersError) {
        console.error(`Error fetching players for team ${team.id}:`, playersError);
        teamPlayersMap.set(team.id, []);
        continue;
      }

      // Query 2: profili degli user_id (bypass RLS facendo query separata)
      const userIds = (players || []).map((p: any) => p.user_id);
      const profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("id", userIds);
        (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));
      }

      // Join manuale
      const enrichedPlayers = (players || []).map((p: any) => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null,
      }));

      teamPlayersMap.set(team.id, enrichedPlayers);
    }
  }

  // Recupera agonisti non assegnati a nessuna squadra
  const { data: allAgonisti } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "agonista")
    .order("full_name", { ascending: true });

  // Filtra escludendo chi è già assegnato a una squadra
  const { data: assignedPlayers } = await supabase
    .from("championship_team_players")
    .select("user_id")
    .eq("status", "active");

  const assignedPlayerIds = new Set((assignedPlayers || []).map((p: any) => p.user_id));
  const availableAgonisti = (allAgonisti || []).filter(
    (a: any) => !assignedPlayerIds.has(a.id)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/admin/campionato" className="text-blue-600 hover:underline">
          ← Torna a campionati
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">{championship.name}</h1>
      </div>

      {/* TABS-LIKE NAVIGATION */}
      <div className="flex gap-4 mb-8 border-b">
        <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold">
          Squadre
        </button>
        {/* TODO: Aggiungi tab Partite, Calendario */}
      </div>

      {/* CREATE TEAM FORM */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Squadra</h2>

        <form action={createTeam} className="space-y-4">
          <input type="hidden" name="championship_id" value={championshipId} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                name="name"
                placeholder="es: Squadra A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serie *
              </label>
              <select
                name="series"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="D3">D3</option>
                <option value="D2">D2</option>
                <option value="D1">D1</option>
                <option value="C2">C2</option>
                <option value="C1">C1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Girone *
              </label>
              <input
                type="text"
                name="group_code"
                placeholder="A"
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Aggiungi Squadra
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* TEAMS TABLE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Serie
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Girone
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Giocatori
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody>
            {teams?.map((team: any) => (
              <tr key={team.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {team.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{team.series}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{team.group_code}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <a
                    href={`#team-${team.id}-players`}
                    className="text-blue-600 hover:underline"
                  >
                    Gestisci
                  </a>
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  <form action={deleteTeam} className="inline">
                    <input type="hidden" name="team_id" value={team.id} />
                    <ConfirmDeleteButton />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!teams?.length && (
          <div className="p-6 text-center text-gray-500">
            Nessuna squadra ancora. Aggiungine una.
          </div>
        )}
      </div>

      {/* TEAMS PLAYERS SECTION */}
      <div className="mt-12 space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Squadre</h2>

        {teams?.map((team: any) => (
          <div
            key={team.id}
            id={`team-${team.id}-players`}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {team.name} — Giocatori
            </h3>

            {/* ADD PLAYER FORM */}
            <form action={addPlayerToTeam} className="mb-6 pb-6 border-b space-y-4">
              <input type="hidden" name="team_id" value={team.id} />

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleziona Agonista
                  </label>
                  <select
                    name="user_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Scegli agonista...</option>
                    {availableAgonisti?.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </form>

            {/* PLAYERS LIST */}
            <div className="space-y-2">
              {teamPlayersMap.get(team.id)?.length > 0 ? (
                teamPlayersMap.get(team.id).map((player: any) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {player.profiles?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">Dal {player.joined_at}</p>
                    </div>
                    <form action={removePlayerFromTeam} className="inline">
                      <input type="hidden" name="player_id" value={player.id} />
                      <ConfirmDeleteButton message="Rimuovere questo giocatore dalla squadra?" />
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Nessun giocatore assegnato.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
