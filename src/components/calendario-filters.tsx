"use client";

import { useState, useMemo } from "react";

interface Match {
  id: string;
  scheduled_start_at: string;
  team_id: string;
  opponent_name: string;
  leg_type: string;
  venue_type: string;
  status: string;
  series?: string;
  group_code?: string;
  team_name?: string;
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
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Squadra</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Serie</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Girone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Avversario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Luogo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((match) => (
                <tr key={match.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(match.scheduled_start_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{match.team_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{match.series}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {match.group_code === "—" ? "—" : `Girone ${match.group_code}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{match.opponent_name}</td>
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
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">Nessuna partita corrisponde ai filtri selezionati.</div>
        )}
      </div>
    </div>
  );
}
