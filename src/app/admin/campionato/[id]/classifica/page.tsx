import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminChampionatoClassificaPage({
  params,
}: PageProps) {
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

  // Recupera classifica
  const { data: standings, error: standingsError } =
    await championships.getChampionshipStandings(supabase, championshipId);

  // Recupera partite completate
  const { data: matchesWithScores } = await championships.getMatchesWithScores(
    supabase,
    championshipId
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a
          href={`/admin/campionato/${championshipId}`}
          className="text-blue-600 hover:underline"
        >
          ← Torna a {championship.name}
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Classifica e Risultati
        </h1>
      </div>

      {/* STANDINGS TABLE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Classifica Squadre
          </h2>
        </div>

        {standings && standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Pos.
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Squadra
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Serie
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Girone
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Partite
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Vittorie
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Sconfitte
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50">
                    Punti
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing: any, idx: number) => (
                  <tr key={standing.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {standing.championship_teams?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {standing.championship_teams?.series || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {standing.championship_teams?.group_code || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {standing.matches_played}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-green-700 font-medium">
                      {standing.wins}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-red-700 font-medium">
                      {standing.losses}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-gray-900 bg-yellow-50">
                      {standing.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Nessun risultato ancora.
          </div>
        )}
      </div>

      {/* RESULTS TABLE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Risultati Partite
          </h2>
        </div>

        {matchesWithScores && matchesWithScores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Squadra
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Risultato
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Avversario
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50">
                    Punti
                  </th>
                </tr>
              </thead>
              <tbody>
                {matchesWithScores.map((match: any) => (
                  <tr key={match.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(match.scheduled_start_at).toLocaleDateString(
                        "it-IT",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {match.championship_teams?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-gray-900">
                      {match.result || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {match.opponent_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">
                      {match.leg_type === "SINGLE" && "Singola"}
                      {match.leg_type === "FIRST_LEG" && "Andata"}
                      {match.leg_type === "RETURN_LEG" && "Ritorno"}
                      {match.venue_type === "HOME" ? " (Casa)" : " (Away)"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-gray-900 bg-yellow-50">
                      {match.assigned_points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Nessun risultato ancora.
          </div>
        )}
      </div>
    </div>
  );
}
