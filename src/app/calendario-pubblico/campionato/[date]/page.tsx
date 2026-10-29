import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateIT, formatTime } from "@/lib/dates";
import { getChampionshipMatchesByDate } from "@/lib/supabase/championship-calendar";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const convocatiByMatch = new Map<string, string[]>();
  if (matchInfo) {
    const db = createAdminClient() || supabase;
    const { data: convocations } = await db
      .from("championship_match_convocations")
      .select("match_id, profiles!user_id(full_name)")
      .in("match_id", matchInfo.matches.map((m) => m.id));

    for (const conv of (convocations ?? []) as any[]) {
      const name = conv.profiles?.full_name;
      if (!name) continue;
      const list = convocatiByMatch.get(conv.match_id) ?? [];
      list.push(name);
      convocatiByMatch.set(conv.match_id, list);
    }
  }

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
              <tr className="bg-gray-100 border-b border-gray-300 text-left text-xs sm:text-sm font-semibold text-gray-700">
                <th className="px-2 sm:px-3 py-2 whitespace-nowrap">Orario</th>
                <th className="px-2 sm:px-3 py-2">Squadra</th>
                <th className="px-2 sm:px-3 py-2">Convocati</th>
                <th className="px-2 sm:px-3 py-2">Avversario</th>
                <th className="px-2 sm:px-3 py-2">Tipo</th>
                <th className="px-2 sm:px-3 py-2">Serie</th>
                <th className="px-2 sm:px-3 py-2">Girone</th>
                <th className="px-2 sm:px-3 py-2">Luogo</th>
                <th className="px-2 sm:px-3 py-2">Indirizzo</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {matchInfo.matches.map((match, idx) => {
                const convocati = convocatiByMatch.get(match.id) ?? [];
                return (
                  <tr key={match.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-2 sm:px-3 py-2 text-gray-900 font-medium whitespace-nowrap align-top">
                      {formatTime(match.start_time)}
                    </td>
                    <td className="px-2 sm:px-3 py-2 font-medium text-gray-900 align-top">
                      {match.team_name}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-700 align-top">
                      {convocati.length > 0 ? convocati.join(", ") : "—"}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-700 align-top">
                      {match.opponent}
                    </td>
                    <td className="px-2 sm:px-3 py-2 align-top">
                      <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full font-semibold ${
                        match.is_home
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {match.is_home ? "Casa" : "Trasferta"}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-700 align-top">
                      <span className="inline-block bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                        {match.series}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-700 align-top">
                      {match.round_name}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-700 align-top">
                      {match.location}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-700 align-top">
                      {match.address || "-"}
                    </td>
                  </tr>
                );
              })}
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
