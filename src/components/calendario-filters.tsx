"use client";

import { useState, useMemo } from "react";

interface Match {
  id: string;
  scheduled_start_at: string;
  team_id: string;
  opponent_name: string;
  leg_type: string;
  venue_type: string;
  venue_name?: string | null;
  status: string;
  series?: string;
  group_code?: string;
  team_name?: string;
}

interface Player {
  id: string;
  full_name: string;
  role?: string;
}

export default function CalendarioFilters({
  matches,
  teamsData,
}: {
  matches: Match[];
  teamsData: Map<string, { name: string; series: string; group_code: string }>;
}) {
  const [filters, setFilters] = useState({
    team: "",
    opponent: "",
    status: "",
    legType: "",
    venue: "",
    series: "",
    girone: "",
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const openMatchDetails = async (match: Match) => {
    setSelectedMatch(match);
    setLoadingPlayers(true);
    try {
      const response = await fetch(`/api/matches/${match.id}/players`);
      if (response.ok) {
        const data = await response.json();
        setMatchPlayers(data.players || []);
      }
    } catch (error) {
      console.error("Error loading players:", error);
      setMatchPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Arricchisci matches con dati squadra
  const enrichedMatches = useMemo(
    () =>
      matches.map((match) => ({
        ...match,
        team_name: teamsData.get(match.team_id)?.name || "—",
        series: teamsData.get(match.team_id)?.series || "—",
        group_code: teamsData.get(match.team_id)?.group_code || "—",
      })),
    [matches, teamsData]
  );

  // Filtra matches
  const filtered = useMemo(() => {
    return enrichedMatches.filter((m) => {
      if (filters.team && !m.team_name.toLowerCase().includes(filters.team.toLowerCase())) return false;
      if (filters.opponent && !m.opponent_name.toLowerCase().includes(filters.opponent.toLowerCase())) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.legType && m.leg_type !== filters.legType) return false;
      if (filters.venue && m.venue_type !== filters.venue) return false;
      if (filters.series && m.series !== filters.series) return false;
      if (filters.girone && m.group_code !== filters.girone) return false;
      return true;
    });
  }, [enrichedMatches, filters]);

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

  const uniqueSeriesValues = [...new Set(enrichedMatches.map((m) => m.series).filter((s) => s !== "—"))];
  const uniqueGironeValues = [...new Set(enrichedMatches.map((m) => m.group_code).filter((g) => g !== "—"))];
  const uniqueStatusValues = [...new Set(enrichedMatches.map((m) => m.status))];

  return (
    <div className="space-y-6">
      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Filtra per squadra..."
            value={filters.team}
            onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Filtra per avversario..."
            value={filters.opponent}
            onChange={(e) => setFilters({ ...filters, opponent: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.series}
            onChange={(e) => setFilters({ ...filters, series: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le serie</option>
            {uniqueSeriesValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.girone}
            onChange={(e) => setFilters({ ...filters, girone: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i gironi</option>
            {uniqueGironeValues.map((g) => (
              <option key={g} value={g}>
                Girone {g}
              </option>
            ))}
          </select>

          <select
            value={filters.legType}
            onChange={(e) => setFilters({ ...filters, legType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i tipi</option>
            <option value="SINGLE">Singola</option>
            <option value="FIRST_LEG">Andata</option>
            <option value="RETURN_LEG">Ritorno</option>
          </select>

          <select
            value={filters.venue}
            onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti i luoghi</option>
            <option value="HOME">Casa</option>
            <option value="AWAY">Trasferta</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutti gli stati</option>
            {uniqueStatusValues.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s)}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setFilters({
                team: "",
                opponent: "",
                status: "",
                legType: "",
                venue: "",
                series: "",
                girone: "",
              })
            }
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Azzera filtri
          </button>
        </div>
      </div>

      {/* RESULTS */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">
            Mostrando <strong>{filtered.length}</strong> di <strong>{matches.length}</strong> partite
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Data</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Squadra</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Serie</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Girone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Avversario</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Luogo</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Sede incontro</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Stato</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((match) => (
                  <tr key={match.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(match.scheduled_start_at)}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{match.team_name}</td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-600">{match.series}</td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-600">
                      {match.group_code === "—" ? "—" : `Girone ${match.group_code}`}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{match.opponent_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {match.leg_type === "SINGLE"
                        ? "Singola"
                        : match.leg_type === "FIRST_LEG"
                          ? "Andata"
                          : "Ritorno"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {match.venue_type === "HOME" ? "Casa" : "Trasferta"}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-4 text-sm text-gray-600">
                      {match.venue_name || "—"}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <button
                        onClick={() => openMatchDetails(match)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Dettagli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">Nessuna partita corrisponde ai filtri selezionati.</div>
        )}
      </div>

      {/* MODAL - MATCH DETAILS */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Dettagli Partita</h2>
                <p className="text-blue-100">
                  {selectedMatch.team_name} vs {selectedMatch.opponent_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Match Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data e Ora</label>
                  <p className="text-gray-900">{formatDate(selectedMatch.scheduled_start_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <p className="text-gray-900">
                    {selectedMatch.leg_type === "SINGLE"
                      ? "Gara Singola"
                      : selectedMatch.leg_type === "FIRST_LEG"
                        ? "Andata"
                        : "Ritorno"}
                    {selectedMatch.venue_type === "HOME" ? " - Casa" : " - Trasferta"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Avversario</label>
                  <p className="text-gray-900">{selectedMatch.opponent_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stato</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMatch.status)}`}>
                    {getStatusLabel(selectedMatch.status)}
                  </span>
                </div>
              </div>

              {/* Venue Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Sede Incontro</h3>
                <p className="text-gray-600">
                  {selectedMatch.venue_name || "Non specificato"}
                </p>
              </div>

              {/* Players */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Giocatori Partecipanti</h3>
                {loadingPlayers ? (
                  <p className="text-gray-500 text-sm">Caricamento...</p>
                ) : matchPlayers.length > 0 ? (
                  <ul className="space-y-2">
                    {matchPlayers.map((player) => (
                      <li key={player.id} className="flex items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900">{player.full_name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">Nessun giocatore assegnato</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
