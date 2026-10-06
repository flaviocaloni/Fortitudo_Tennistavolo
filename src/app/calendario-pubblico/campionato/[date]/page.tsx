import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateIT, formatTime } from "@/lib/dates";
import { getChampionshipMatchesByDate } from "@/lib/supabase/championship-calendar";

export const dynamic = "force-dynamic";

export default async function ChampionshipDetailsPage(
  props: {
    params: Promise<{ date: string }>;
  }
) {
  const params = await props.params;
  const date = params.date;

  const supabase = await createClient();

  // Fetch championship matches for this date and the day after (to cover the full day)
  const tomorrow = new Date(date + "T23:59:59");
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const matchesByDate = await getChampionshipMatchesByDate(supabase, date, tomorrowStr);
  const matchInfo = matchesByDate.get(date);

  if (!matchInfo || matchInfo.matches.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/calendario-pubblico" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Torna al Calendario
        </Link>
        <div className="card text-sm text-slate-600">
          Nessuna partita di campionato trovata per {formatDateIT(date)}.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/calendario-pubblico" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Torna al Calendario
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🏐 Partite di Campionato</h1>
        <p className="text-gray-600 mt-2">{formatDateIT(date)}</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Squadra</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Serie</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Girone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Avversario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Luogo</th>
              </tr>
            </thead>
            <tbody>
              {matchInfo.matches.map((match, idx) => (
                <tr key={match.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                    {formatTime(match.start_time)}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {match.team_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                      {match.series}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {match.round_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {match.opponent}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full font-semibold ${
                      match.is_home
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {match.is_home ? "Casa" : "Trasferta"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {match.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            Totale: {matchInfo.matches.length} {matchInfo.matches.length === 1 ? "partita" : "partite"}
          </p>
        </div>
      </div>
    </div>
  );
}
