"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { updateAdminAttendance } from "@/lib/actions/championships";

interface Team {
  id: string;
  name: string;
  group_code?: string;
}

interface Match {
  id: string;
  team_id: string;
  opponent_name: string;
  scheduled_start_at: string;
  venue_type: string;
}

interface Player {
  id: string;
  user_id: string;
  team_id: string;
  full_name: string;
  joined_at: string;
  status: string;
}

interface Attendance {
  id: string;
  match_id: string;
  user_id: string;
  status: "PRESENT" | "ABSENT";
}

export default function FormazioniClient({
  championshipId,
  teams,
  matches,
  players,
  attendances,
  selectedTeamId,
  selectedMatchId,
  selectedTeam,
  selectedMatch,
}: {
  championshipId: string;
  teams: Team[];
  matches: Match[];
  players: Player[];
  attendances: Attendance[];
  selectedTeamId?: string;
  selectedMatchId?: string;
  selectedTeam?: Team;
  selectedMatch?: Match;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleAttendanceChange = async (userId: string, status: "PRESENT" | "ABSENT") => {
    if (!selectedMatchId) return;

    setUpdatingUserId(userId);
    try {
      const formData = new FormData();
      formData.append("match_id", selectedMatchId);
      formData.append("user_id", userId);
      formData.append("status", status);

      await updateAdminAttendance(formData);

      // Ricarica la pagina per aggiornare i dati
      router.refresh();
    } catch (error) {
      console.error("Errore nell'aggiornamento della presenza:", error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleMatchChange = (matchId: string) => {
    const params = new URLSearchParams();
    if (matchId) params.set("partita", matchId);
    router.push(`?${params.toString()}`);
  };

  const handleTeamChange = (teamId: string) => {
    const params = new URLSearchParams();
    if (teamId) params.set("squadra", teamId);
    router.push(`?${params.toString()}`);
  };

  const getPlayerAttendance = (userId: string): Attendance | undefined => {
    return attendances.find((a) => a.user_id === userId);
  };

  const matchDate = selectedMatch
    ? new Date(selectedMatch.scheduled_start_at).toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const matchTime = selectedMatch
    ? new Date(selectedMatch.scheduled_start_at).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="space-y-6">
      {/* FILTRI */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtri</h2>

        <div className="grid grid-cols-1 gap-4">
          {/* Squadra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Squadra</label>
            <select
              value={selectedTeamId || ""}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona una squadra...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PARTITE DELLA SQUADRA */}
      {selectedTeamId && matches.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Partite ({matches.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Avversario</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sede</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Azione</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} className={`border-b hover:bg-gray-50 cursor-pointer ${selectedMatchId === match.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(match.scheduled_start_at).toLocaleDateString("it-IT")} {new Date(match.scheduled_start_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{match.opponent_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {match.venue_type === "HOME" ? "Casa" : "Trasferta"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {match.opponent_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleMatchChange(match.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          selectedMatchId === match.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {selectedMatchId === match.id ? "✓ Selezionata" : "Seleziona"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETTAGLI PARTITA */}
      {selectedMatch && selectedTeamId && (
        (() => {
          const displayTeam = selectedTeam || teams.find((t) => t.id === selectedMatch.team_id);
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{displayTeam?.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Squadra</p>
                  <p className="text-gray-800">{displayTeam?.name}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Girone</p>
                  <p className="text-gray-800">{displayTeam?.group_code || "—"}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Avversario</p>
                  <p className="text-gray-800">{selectedMatch.opponent_name}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Data</p>
                  <p className="text-gray-800">{matchDate}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Ora</p>
                  <p className="text-gray-800">{matchTime}</p>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* GIOCATORI */}
      {selectedMatchId && players.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Giocatori Disponibili ({players.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Squadra</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Girone</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Presenza</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const attendance = getPlayerAttendance(player.user_id);
                  const playerTeam = teams.find((t) => t.id === player.team_id);
                  return (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{playerTeam?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{playerTeam?.group_code || "—"}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleAttendanceChange(player.user_id, "PRESENT")}
                            disabled={updatingUserId === player.user_id}
                            className={`px-3 py-1 rounded text-xs font-medium transition ${
                              attendance?.status === "PRESENT"
                                ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100"
                            }`}
                          >
                            {updatingUserId === player.user_id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(player.user_id, "ABSENT")}
                            disabled={updatingUserId === player.user_id}
                            className={`px-3 py-1 rounded text-xs font-medium transition ${
                              attendance?.status === "ABSENT"
                                ? "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100"
                            }`}
                          >
                            {updatingUserId === player.user_id ? "..." : "✗"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedMatchId && players.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Nessun giocatore disponibile per questa partita.</p>
        </div>
      ) : selectedTeamId && matches.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Nessuna partita disponibile per questa squadra.</p>
        </div>
      ) : !selectedTeamId ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Seleziona una squadra per visualizzare le sue partite.</p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Seleziona una partita per visualizzare i giocatori.</p>
        </div>
      )}
    </div>
  );
}
