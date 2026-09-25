import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import FitetLinksTable from "@/components/fitet-links-table";

interface PageProps {
  params: Promise<{ championshipId: string }>;
}

export default async function ChampionatoClassificaPage({
  params,
}: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  const { championshipId } = await params;

  // Recupera campionato
  const { data: championship, error: champError } =
    await championships.getChampionshipById(supabase, championshipId);

  if (champError || !championship) {
    notFound();
  }

  // Recupera tutte le squadre
  const { data: teams } = await championships.getTeamsByChampionshipId(
    supabase,
    championshipId
  );

  // Recupera classifica
  const { data: standings, error: standingsError } =
    await championships.getChampionshipStandings(supabase, championshipId);

  // Recupera partite completate
  const { data: matchesWithScores } = await championships.getMatchesWithScores(
    supabase,
    championshipId
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <a
          href="/campionato"
          className="text-blue-600 hover:underline text-sm sm:text-base"
        >
          ← Torna ai campionati
        </a>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 sm:mt-4">
          {championship.name}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Classifica e Risultati</p>
      </div>

      {/* SQUADRE E LINK FITET */}
      <FitetLinksTable teams={teams || []} />

      {/* STANDINGS TABLE */}
      {standings && standings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Classifica Squadre
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-700">
                    Pos.
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-700">
                    Squadra
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    Serie
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    Girone
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    Partite
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    V
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    S
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700 bg-yellow-50">
                    Punti
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing: any, idx: number) => (
                  <tr key={standing.id} className="border-b hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-2 sm:py-4 font-bold text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 font-medium text-gray-900">
                      {standing.championship_teams?.name || "—"}
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-600">
                      {standing.championship_teams?.series || "—"}
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-600">
                      {standing.championship_teams?.group_code || "—"}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-600">
                      {standing.matches_played}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-green-700 font-medium">
                      {standing.wins}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-red-700 font-medium">
                      {standing.losses}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center font-bold text-gray-900 bg-yellow-50">
                      {standing.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESULTS TABLE */}
      {matchesWithScores && matchesWithScores.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Risultati Partite
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-700">
                    Squadra
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    Ris.
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-700">
                    Avversario
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-700 bg-yellow-50">
                    Pti
                  </th>
                </tr>
              </thead>
              <tbody>
                {matchesWithScores.map((match: any) => (
                  <tr key={match.id} className="border-b hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-gray-600">
                      {new Date(match.scheduled_start_at).toLocaleDateString(
                        "it-IT",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 font-medium text-gray-900">
                      {match.championship_teams?.name || "—"}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center font-bold text-gray-900">
                      {match.result || "—"}
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-4 text-gray-600">
                      {match.opponent_name}
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-600">
                      {match.leg_type === "SINGLE" && "Singola"}
                      {match.leg_type === "FIRST_LEG" && "Andata"}
                      {match.leg_type === "RETURN_LEG" && "Ritorno"}
                      {match.venue_type === "HOME" ? " (Casa)" : " (Away)"}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center font-bold text-gray-900 bg-yellow-50">
                      {match.assigned_points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
