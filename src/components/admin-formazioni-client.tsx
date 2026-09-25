"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Team {
  id: string;
  name: string;
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

  const handleTeamChange = (teamId: string) => {
    const params = new URLSearchParams();
    params.set("squadra", teamId);
    router.push(`?${params.toString()}`);
  };

  const handleMatchChange = (matchId: string) => {
    const params = new URLSearchParams();
    params.set("squadra", selectedTeamId || "");
    params.set("partita", matchId);
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

          {/* Partita */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Partita</label>
            <select
              value={selectedMatchId || ""}
              onChange={(e) => handleMatchChange(e.target.value)}
              disabled={!selectedTeamId || matches.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Seleziona una partita...</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.opponent_name} - {new Date(match.scheduled_start_at).toLocaleDateString("it-IT")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DETTAGLI PARTITA */}
      {selectedMatch && selectedTeam && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">{selectedTeam.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
            <div>
              <p className="text-blue-700 font-medium">Sede</p>
              <p className="text-gray-800">{selectedMatch.venue_type === "HOME" ? "Casa" : "Trasferta"}</p>
            </div>
          </div>
        </div>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data Iscrizione</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Presenza</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Stato</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const attendance = getPlayerAttendance(player.user_id);
                  return (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(player.joined_at).toLocaleDateString("it-IT")}
                      </td>
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
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          Attivo
                        </span>
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
          <p className="text-yellow-800">Nessun giocatore disponibile per questa squadra.</p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">Seleziona una squadra e una partita per visualizzare i giocatori.</p>
        </div>
      )}
    </div>
  );
}
