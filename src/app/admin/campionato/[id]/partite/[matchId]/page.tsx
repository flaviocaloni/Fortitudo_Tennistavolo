import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import { updateAdminAttendance } from "@/lib/actions/championships";
import ConfirmDeleteButton from "@/components/confirm-delete-button";

interface PageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export default async function AdminMatchDetailsPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/campionato");
  }

  const { id: championshipId, matchId } = await params;

  // Recupera partita
  const { data: match, error: matchError } = await championships.getMatchById(
    supabase,
    matchId
  );

  if (matchError || !match) {
    notFound();
  }

  // Verifica che la partita appartenga al campionato
  if (match.championship_id !== championshipId) {
    notFound();
  }

  // Recupera nome squadra
  const { data: team } = await supabase
    .from("championship_teams")
    .select("name")
    .eq("id", match.team_id)
    .single();

  // Recupera attendances (senza join complesso)
  const { data: attendances } = await supabase
    .from("championship_match_attendances")
    .select("id, user_id, status")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  // Recupera giocatori della squadra
  const { data: teamPlayers } = await supabase
    .from("championship_team_players")
    .select("user_id")
    .eq("team_id", match.team_id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  // Recupera profili di tutti gli user_id
  const allUserIds = new Set([
    ...(attendances || []).map((a: any) => a.user_id),
    ...(teamPlayers || []).map((tp: any) => tp.user_id),
  ]);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(allUserIds));

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
  const attendanceMap = new Map(attendances?.map((a: any) => [a.user_id, a]) || []);

  // Combina dati: usa attendances se esistono, altrimenti usa teamPlayers
  let players: any[] = [];
  const processedUserIds = new Set();

  // Prima aggiungi gli attendances
  (attendances || []).forEach((att: any) => {
    const profile = profileMap.get(att.user_id);
    if (profile) {
      players.push({
        id: profile.id,
        full_name: profile.full_name,
        attendanceId: att.id,
        status: att.status,
      });
      processedUserIds.add(att.user_id);
    }
  });

  // Poi aggiungi i giocatori della squadra che non hanno attendance
  (teamPlayers || []).forEach((tp: any) => {
    if (!processedUserIds.has(tp.user_id)) {
      const profile = profileMap.get(tp.user_id);
      if (profile) {
        players.push({
          id: profile.id,
          full_name: profile.full_name,
          attendanceId: null,
          status: "PRESENT",
        });
        processedUserIds.add(tp.user_id);
      }
    }
  });

  console.log(`DEBUG: Match ${matchId} - Attendances: ${attendances?.length || 0}, Team Players: ${teamPlayers?.length || 0}, Final Players: ${players.length}`);

  const presentCount = players.filter((p) => p.status === "PRESENT").length;
  const absentCount = players.filter((p) => p.status === "ABSENT").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a
          href={`/admin/campionato/${championshipId}/partite`}
          className="text-blue-600 hover:underline"
        >
          ← Torna a partite
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Presenze Partita</h1>
      </div>

      {/* MATCH INFO */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Squadra
            </label>
            <p className="text-gray-900 font-medium">{team?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Avversario
            </label>
            <p className="text-gray-900">{match.opponent_name}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Data e Ora
            </label>
            <p className="text-gray-900">
              {new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tipo
            </label>
            <p className="text-gray-900">
              {match.leg_type === "SINGLE" && "Singola"}
              {match.leg_type === "FIRST_LEG" && "Andata"}
              {match.leg_type === "RETURN_LEG" && "Ritorno"}
              {match.venue_type === "HOME" ? " - Casa" : " - Trasferta"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sede
            </label>
            <p className="text-gray-900">{match.venue_type === "HOME" ? "Casa" : "Trasferta"}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Luogo
            </label>
            <p className="text-gray-900">{match.venue_name || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Indirizzo
            </label>
            <p className="text-gray-900">{match.address || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Note
            </label>
            <p className="text-gray-900 whitespace-pre-wrap">{match.notes || "-"}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{presentCount}</div>
            <div className="text-sm text-green-600">Presenti</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700">{absentCount}</div>
            <div className="text-sm text-red-600">Assenti</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">{players.length}</div>
            <div className="text-sm text-blue-600">Totale</div>
          </div>
        </div>
      </div>

      {/* PLAYERS ATTENDANCE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Gestione Presenze</h2>
        </div>

        {players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Giocatore
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {player.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          player.status === "PRESENT"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {player.status === "PRESENT" ? "✓ Presente" : "✕ Assente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <form action={updateAdminAttendance} className="flex gap-2">
                        <input
                          type="hidden"
                          name="match_id"
                          value={matchId}
                        />
                        <input
                          type="hidden"
                          name="user_id"
                          value={player.id}
                        />
                        {player.status !== "PRESENT" && (
                          <button
                            type="submit"
                            name="status"
                            value="PRESENT"
                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition"
                          >
                            Presente
                          </button>
                        )}
                        {player.status !== "ABSENT" && (
                          <button
                            type="submit"
                            name="status"
                            value="ABSENT"
                            className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition"
                          >
                            Assente
                          </button>
                        )}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            Nessun giocatore assegnato
          </div>
        )}
      </div>
    </div>
  );
}
