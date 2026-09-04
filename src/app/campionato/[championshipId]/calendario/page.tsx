import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";

interface PageProps {
  params: Promise<{ championshipId: string }>;
}

export default async function CalendarioPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  const { championshipId } = await params;

  // Recupera campionato
  const { data: championship } = await championships.getChampionshipById(
    supabase,
    championshipId
  );

  if (!championship) {
    redirect("/campionato");
  }

  // Recupera tutte le partite del campionato
  const { data: matches } = await championships.getMatchesByChampionshipId(
    supabase,
    championshipId
  );

  // Recupera squadre per il filtro
  const { data: teams } = await supabase
    .from("championship_teams")
    .select("id, name")
    .eq("championship_id", championshipId)
    .eq("status", "active")
    .order("name");

  const teamsMap = new Map(teams?.map((t: any) => [t.id, t.name]));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: "Programmata",
      PLAYED: "Giocata",
      POSTPONED: "Rinviata",
      CANCELLED: "Annullata",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "PLAYED":
        return "bg-green-100 text-green-800";
      case "POSTPONED":
        return "bg-amber-100 text-amber-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href={`/campionato`} className="text-blue-600 hover:underline">
          ← Torna a campionati
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          {championship.name} — Calendario
        </h1>
      </div>

      {matches && matches.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Squadra
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Avversario
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Luogo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Stato
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match: any) => (
                <tr key={match.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(match.scheduled_start_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {teamsMap.get(match.team_id) || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {match.opponent_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {match.leg_type === "SINGLE"
                      ? "Singola"
                      : match.leg_type === "FIRST_LEG"
                        ? "Andata"
                        : "Ritorno"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {match.venue_type === "HOME" ? "Casa" : "Trasferta"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                      {getStatusLabel(match.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Nessuna partita programmata per questo campionato.</p>
        </div>
      )}
    </div>
  );
}
