import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import { updateMyAttendance } from "@/lib/actions/championships";

interface PageProps {
  params: Promise<{ championshipId: string }>;
}

export default async function MyMatchesPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || profile.role !== "agonista") {
    redirect("/campionato");
  }

  const { championshipId } = await params;

  // Recupera campionato
  const { data: championship, error: champError } =
    await championships.getChampionshipById(supabase, championshipId);

  if (champError || !championship) {
    notFound();
  }

  // Recupera squadre dell'utente nel campionato
  const { data: userTeams } = await supabase
    .from("championship_team_players")
    .select("team_id")
    .eq("user_id", profile.id)
    .eq("status", "active");

  const teamIds = userTeams?.map((t: any) => t.team_id) || [];

  if (teamIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <a href={`/campionato/${championshipId}`} className="text-blue-600 hover:underline">
          ← Torna a Campionato
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-8">Le mie partite</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">Non sei iscritto a nessuna squadra in questo campionato.</p>
        </div>
      </div>
    );
  }

  // Recupera partite delle squadre dell'utente
  const { data: matches } = await supabase
    .from("championship_matches")
    .select("*")
    .eq("championship_id", championshipId)
    .in("team_id", teamIds)
    .order("scheduled_start_at", { ascending: true });

  // Recupera dati delle squadre
  const { data: teams } = await supabase
    .from("championship_teams")
    .select("*")
    .in("id", teamIds);

  const teamMap = new Map(teams?.map((t: any) => [t.id, t]) || []);

  // Per ogni partita, recupera lo status di presenza dell'utente
  const matchesWithAttendance = await Promise.all(
    (matches || []).map(async (match: any) => {
      const { data: attendance } = await supabase
        .from("championship_match_attendances")
        .select("id, status")
        .eq("match_id", match.id)
        .eq("user_id", profile.id)
        .single();

      return {
        ...match,
        attendance,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <a href="/campionato" className="text-blue-600 hover:underline">
        ← Torna a Campionato
      </a>
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-8">Le mie partite</h1>

      {matchesWithAttendance.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">Nessuna partita programmata per le tue squadre.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchesWithAttendance.map((match: any) => {
            const team = teamMap.get(match.team_id);
            const status = match.attendance?.status || "PRESENT";
            const isPresent = status === "PRESENT";

            return (
              <div
                key={match.id}
                className={`rounded-lg shadow-md p-6 border-l-4 ${
                  isPresent ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Squadra</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {team?.name || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data e Ora</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Avversario</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {match.opponent_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Tipo</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {match.leg_type === "SINGLE" && "Singola"}
                      {match.leg_type === "FIRST_LEG" && "Andata"}
                      {match.leg_type === "RETURN_LEG" && "Ritorno"}
                      {match.venue_type === "HOME" ? " - Casa" : " - Trasferta"}
                    </div>
                  </div>
                </div>

                {/* Status e Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t">
                  <div className="mb-4 sm:mb-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        isPresent
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {isPresent ? "✓ Presente" : "✕ Assente"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!isPresent && (
                      <form action={updateMyAttendance}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input type="hidden" name="status" value="PRESENT" />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition"
                        >
                          Dichiara Presenza
                        </button>
                      </form>
                    )}
                    {isPresent && (
                      <form action={updateMyAttendance}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input type="hidden" name="status" value="ABSENT" />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                        >
                          Dichiara Assenza
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
