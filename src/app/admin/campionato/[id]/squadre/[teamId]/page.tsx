import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { deactivateTeam, addPlayerToTeam, removePlayerFromTeam } from "@/lib/actions/teams";

interface PageProps {
  params: Promise<{ id: string; teamId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminSquadraDetailPage({ params, searchParams }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  const { id: championshipId, teamId } = await params;
  const { error, success } = await searchParams;

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

  // Recupera squadra
  const { data: team, error: teamError } = await dbClient
    .from("championship_teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team || team.championship_id !== championshipId) {
    notFound();
  }

  // Recupera giocatori della squadra con profili
  const { data: playersData } = await dbClient
    .from("championship_team_players")
    .select("*")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: false });

  // Arricchisci con i dati dei profili
  let players: any[] = [];
  if (playersData && playersData.length > 0) {
    const playerIds = playersData.map((p) => p.player_id);
    const { data: profilesData } = await dbClient
      .from("profiles")
      .select("id, full_name, role")
      .in("id", playerIds);

    players = playersData.map((p) => ({
      ...p,
      profiles: profilesData?.find((pr) => pr.id === p.player_id),
    }));
  }

  // Recupera agonisti non assegnati a questa squadra
  const assignedPlayerIds = playersData?.map((p) => p.player_id) || [];
  const { data: availablePlayers } = await dbClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "agonista")
    .not("id", "in", assignedPlayerIds.length > 0 ? `(${assignedPlayerIds.map((id) => `'${id}'`).join(",")})` : "()")
    .order("full_name");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/campionato/${championshipId}/squadre`}
          className="text-blue-600 hover:underline"
        >
          ← Torna alla lista squadre
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Dettagli Squadra</h1>
        <p className="text-gray-600 mt-1">{team.name}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* TEAM INFO */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Informazioni Squadra</h2>
          {team.status === "active" && (
            <form action={deactivateTeam} className="inline">
              <input type="hidden" name="teamId" value={teamId} />
              <input type="hidden" name="championshipId" value={championshipId} />
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                Disattiva Squadra
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Squadra</label>
            <p className="text-gray-900 font-medium">{team.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
            <p className="text-gray-900 font-medium">{team.series}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Girone</label>
            <p className="text-gray-900 font-medium">{team.group_code}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <p className="text-gray-900 font-medium">{team.status}</p>
          </div>
        </div>
      </div>

      {/* ADD PLAYER FORM */}
      {availablePlayers && availablePlayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Giocatore</h2>
          <form action={addPlayerToTeam} className="flex gap-4">
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="championshipId" value={championshipId} />
            <select
              name="playerId"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona un agonista...</option>
              {availablePlayers.map((player: any) => (
                <option key={player.id} value={player.id}>
                  {player.full_name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Aggiungi
            </button>
          </form>
        </div>
      )}

      {/* PLAYERS LIST */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Giocatori ({players?.length || 0})</h2>

        {players && players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profilo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data Iscrizione</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player: any) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {player.profiles?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {player.profiles?.role || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          player.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {player.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(player.joined_at).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <form action={removePlayerFromTeam} className="inline">
                        <input type="hidden" name="teamId" value={teamId} />
                        <input type="hidden" name="championshipId" value={championshipId} />
                        <input type="hidden" name="playerId" value={player.player_id} />
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-800"
                        >
                          Rimuovi
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nessun giocatore iscritto</p>
        )}
      </div>
    </div>
  );
}
