"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

  const handleMatchChange = (matchId: string) => {
    const params = new URLSearchParams();
    if (matchId) params.set("partita", matchId);
    router.push(`?${params.toString()}`);
  };

  const handleTeamChange = (teamId: string) => {
    const params = new URLSearchParams();
    if (selectedMatchId) params.set("partita", selectedMatchId);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Partita */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Partita (Data)</label>
            <select
              value={selectedMatchId || ""}
              onChange={(e) => handleMatchChange(e.target.value)}
              disabled={matches.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Seleziona una data partita...</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.opponent_name} - {new Date(match.scheduled_start_at).toLocaleDateString("it-IT")}
                </option>
              ))}
            </select>
          </div>

          {/* Squadra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Squadra</label>
            <select
              value={selectedTeamId || ""}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={!selectedMatchId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
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

      {/* DETTAGLI PARTITA */}
      {selectedMatch && (selectedTeam || selectedMatchId) && (
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
                        {attendance ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              attendance.status === "PRESENT"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {attendance.status === "PRESENT" ? "✓ Presente" : "✗ Assente"}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
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
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Seleziona una data partita e poi una squadra per visualizzare i giocatori.</p>
        </div>
      )}
    </div>
  );
}
