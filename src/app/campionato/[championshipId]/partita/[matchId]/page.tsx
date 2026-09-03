import { notFound, redirect } from "next/redirect";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import { updateAttendanceAsAdmin, updateMyAttendance } from "@/lib/actions/championships";

interface PageProps {
  params: Promise<{ championshipId: string; matchId: string }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  const { championshipId, matchId } = await params;

  // Recupera match
  const { data: match, error: matchError } = await championships.getMatchById(
    supabase,
    matchId
  );

  if (matchError || !match) {
    notFound();
  }

  // Verifica che il match appartiene al campionato
  if (match.championship_id !== championshipId) {
    notFound();
  }

  // Recupera team
  const { data: team } = await supabase
    .from("championship_teams")
    .select("name")
    .eq("id", match.team_id)
    .single();

  // Recupera presenze
  const { data: attendances } = await championships.getAttendancesByMatchId(
    supabase,
    matchId
  );

  // Verifica se l'utente appartiene alla squadra
  const { data: userTeamMembership } = await supabase
    .from("championship_team_players")
    .select("id")
    .eq("team_id", match.team_id)
    .eq("user_id", profile.id)
    .eq("status", "active")
    .single();

  const userIsTeamMember = !!userTeamMembership;

  // Verifica se la partita è iniziata
  const hasStarted = await championships.matchHasStarted(supabase, matchId);

  // Conta presenze
  const presentCount = attendances?.filter((a: any) => a.status === "PRESENT").length || 0;
  const absentCount = attendances?.filter((a: any) => a.status === "ABSENT").length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href={`/campionato/${championshipId}`} className="text-blue-600 hover:underline">
          ← Torna al campionato
        </a>
      </div>

      {/* MATCH HEADER */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {team?.name} <span className="text-gray-600 text-2xl">vs</span> {match.opponent_name}
            </h1>
            {match.opponent_club_name && (
              <p className="text-gray-600 mt-1">{match.opponent_club_name}</p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {match.status === "SCHEDULED" && "Programmata"}
              {match.status === "COMPLETED" && "Completata"}
              {match.status === "CANCELLED" && "Annullata"}
              {match.status === "POSTPONED" && "Rinviata"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-600 text-sm">Data e Ora</div>
            <div className="font-semibold text-gray-900 mt-1">
              {new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          <div>
            <div className="text-gray-600 text-sm">Sede</div>
            <div className="font-semibold text-gray-900 mt-1">
              {match.venue_type === "HOME" ? "Casa" : "Trasferta"}
            </div>
          </div>

          <div>
            <div className="text-gray-600 text-sm">Tipo Gara</div>
            <div className="font-semibold text-gray-900 mt-1">
              {match.leg_type === "SINGLE" && "Singola"}
              {match.leg_type === "FIRST_LEG" && "Andata"}
              {match.leg_type === "RETURN_LEG" && "Ritorno"}
            </div>
          </div>

          {match.result && (
            <div>
              <div className="text-gray-600 text-sm">Risultato</div>
              <div className="font-semibold text-gray-900 mt-1">{match.result}</div>
            </div>
          )}
        </div>

        {match.venue_name && (
          <div className="mt-4 text-sm">
            <div className="text-gray-600">Luogo</div>
            <div className="font-semibold text-gray-900">{match.venue_name}</div>
          </div>
        )}

        {match.address && (
          <div className="mt-2 text-sm">
            <div className="text-gray-600">Indirizzo</div>
            <div className="font-semibold text-gray-900">{match.address}</div>
          </div>
        )}

        {match.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="text-gray-600 font-semibold">Note</div>
            <div className="text-gray-900 mt-1">{match.notes}</div>
          </div>
        )}
      </div>

      {/* ATTENDANCE STATS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 text-sm font-semibold">Presenti</div>
          <div className="text-3xl font-bold text-green-900 mt-2">{presentCount}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm font-semibold">Assenti</div>
          <div className="text-3xl font-bold text-red-900 mt-2">{absentCount}</div>
        </div>
      </div>

      {/* ATTENDANCES TABLE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Presenze</h2>
        </div>

        {attendances && attendances.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Agonista
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Stato
                </th>
                {profile.role === "admin" && (
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Azioni
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {attendances.map((att: any) => {
                const isCurrentUser = att.user_id === profile.id;
                const canModify = profile.role === "admin" || (isCurrentUser && !hasStarted);

                return (
                  <tr
                    key={att.id}
                    className={`border-b ${
                      isCurrentUser ? "bg-blue-50" : ""
                    } hover:bg-gray-50`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {att.user?.full_name || att.user_id}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">
                          (Tu)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          att.status === "PRESENT"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {att.status === "PRESENT" ? "Presente" : "Assente"}
                      </span>
                    </td>
                    {profile.role === "admin" && (
                      <td className="px-6 py-4 text-sm text-right">
                        <form
                          action={updateAttendanceAsAdmin}
                          className="inline space-x-2"
                        >
                          <input type="hidden" name="attendance_id" value={att.id} />
                          {att.status !== "PRESENT" && (
                            <button
                              type="submit"
                              name="status"
                              value="PRESENT"
                              className="text-blue-600 hover:underline"
                            >
                              Segna presente
                            </button>
                          )}
                          {att.status !== "ABSENT" && (
                            <button
                              type="submit"
                              name="status"
                              value="ABSENT"
                              className="text-red-600 hover:underline"
                            >
                              Segna assente
                            </button>
                          )}
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Nessuna presenza registrata.
          </div>
        )}
      </div>

      {/* USER ATTENDANCE CONTROL (agonista) */}
      {userIsTeamMember && profile.role === "agonista" && !hasStarted && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Modifica la tua presenza
          </h3>

          <div className="flex gap-4">
            <form action={updateMyAttendance} className="flex gap-2">
              <input type="hidden" name="match_id" value={matchId} />
              <input type="hidden" name="status" value="PRESENT" />
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Conferma Presenza
              </button>
            </form>

            <form action={updateMyAttendance} className="flex gap-2">
              <input type="hidden" name="match_id" value={matchId} />
              <input type="hidden" name="status" value="ABSENT" />
              <button
                type="submit"
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Rimuovi Presenza
              </button>
            </form>
          </div>

          {hasStarted && (
            <p className="text-red-600 text-sm mt-4">
              ⚠️ Non puoi modificare la tua presenza dopo l'inizio della partita.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
