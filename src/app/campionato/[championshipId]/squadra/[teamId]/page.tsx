import { notFound, redirect } from "next/redirect";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";

interface PageProps {
  params: Promise<{ championshipId: string; teamId: string }>;
}

export default async function SquadraDetailPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  const { championshipId, teamId } = await params;

  // Recupera squadra
  const { data: team, error: teamError } = await championships.getTeamById(
    supabase,
    teamId
  );

  if (teamError || !team) {
    notFound();
  }

  // Verifica che la squadra appartiene al campionato
  if (team.championship_id !== championshipId) {
    notFound();
  }

  // Recupera giocatori della squadra
  const { data: players } = await championships.getPlayersByTeamId(supabase, teamId);

  // Recupera partite della squadra
  const { data: matches } = await championships.getMatchesByTeamId(supabase, teamId);

  const upcomingMatches = matches?.filter(
    (m: any) => new Date(m.scheduled_start_at) > new Date()
  ) || [];
  const pastMatches = matches?.filter(
    (m: any) => new Date(m.scheduled_start_at) <= new Date()
  ) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href={`/campionato/${championshipId}/squadre`} className="text-blue-600 hover:underline">
          ← Torna alle squadre
        </a>
      </div>

      {/* TEAM HEADER */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
        <div className="flex gap-4 mt-4">
          <div>
            <div className="text-gray-600 text-sm">Serie</div>
            <div className="font-semibold text-gray-900">{team.series}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Girone</div>
            <div className="font-semibold text-gray-900">{team.group_code}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Stato</div>
            <div className="font-semibold text-gray-900">
              {team.status === "active" ? "Attiva" : "Archiviata"}
            </div>
          </div>
        </div>
      </div>

      {/* PLAYERS SECTION */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Giocatori</h2>

        {players && players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Ruolo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Dal
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player: any) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {player.profiles?.full_name || player.user_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {player.profiles?.role === "agonista" ? "Agonista" : "Amatore"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(player.joined_at).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Nessun giocatore assegnato.</p>
        )}
      </div>

      {/* UPCOMING MATCHES */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Prossime Partite</h2>

        {upcomingMatches.length > 0 ? (
          <div className="space-y-4">
            {upcomingMatches.map((match: any) => (
              <Link
                key={match.id}
                href={`/campionato/${championshipId}/partita/${match.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      vs {match.opponent_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {match.venue_type === "HOME" ? "🏠 Casa" : "🚌 Trasferta"}
                      {match.venue_name && ` • ${match.venue_name}`}
                    </div>
                  </div>
                  <span className="text-blue-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nessuna partita programmata.</p>
        )}
      </div>

      {/* PAST MATCHES */}
      {pastMatches.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Partite Passate</h2>

          <div className="space-y-4">
            {pastMatches.map((match: any) => (
              <Link
                key={match.id}
                href={`/campionato/${championshipId}/partita/${match.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      vs {match.opponent_name}
                      {match.result && (
                        <span className="ml-2 text-sm font-bold text-green-600">
                          {match.result}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {match.status === "COMPLETED" && "✓ Completata"}
                      {match.status === "CANCELLED" && "✗ Annullata"}
                      {match.status === "POSTPONED" && "⏸ Rinviata"}
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
