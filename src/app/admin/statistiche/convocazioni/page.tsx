"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Convocation {
  id: string;
  match_id: string;
  user_id: string;
  convocated_at: string;
  notes: string | null;
  profiles: { id: string; full_name: string } | null;
  championship_matches: {
    id: string;
    scheduled_start_at: string;
    opponent_name: string;
    championship_teams: { id: string; name: string } | null;
  } | null;
}

export default function ConvocazioniPage() {
  const [convocations, setConvocations] = useState<Convocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [championships, setChampionships] = useState<any[]>([]);

  const supabase = createClient();

  // Load championships on mount
  useEffect(() => {
    const loadChampionships = async () => {
      const { data } = await supabase.from("championships").select("id, name").order("name");
      setChampionships(data || []);
      if (data && data.length > 0) {
        setChampionshipId(data[0].id);
      }
    };
    loadChampionships();
  }, []);

  // Load teams when championship changes
  useEffect(() => {
    if (!championshipId) return;
    const loadTeams = async () => {
      const { data } = await supabase
        .from("championship_teams")
        .select("id, name")
        .eq("championship_id", championshipId)
        .eq("status", "active")
        .order("name");
      setTeams(data || []);
    };
    loadTeams();
  }, [championshipId]);

  // Load convocations with filters
  useEffect(() => {
    const loadConvocations = async () => {
      if (!championshipId) return;
      setLoading(true);

      let query = supabase
        .from("championship_match_convocations")
        .select(
          `
          id,
          match_id,
          user_id,
          convocated_at,
          notes,
          profiles(id, full_name),
          championship_matches:match_id(
            id,
            scheduled_start_at,
            opponent_name,
            championship_teams:team_id(id, name)
          )
          `
        );

      if (championshipId) {
        query = query.eq("championship_matches.championship_id", championshipId);
      }

      if (teamId) {
        query = query.eq("championship_matches.team_id", teamId);
      }

      if (startDate) {
        query = query.gte("championship_matches.scheduled_start_at", startDate + "T00:00:00");
      }
      if (endDate) {
        query = query.lte("championship_matches.scheduled_start_at", endDate + "T23:59:59");
      }

      const { data, error } = await query.order("championship_matches.scheduled_start_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error loading convocations:", error);
      } else {
        setConvocations((data as any[]) || []);
      }
      setLoading(false);
    };

    loadConvocations();
  }, [championshipId, teamId, startDate, endDate]);

  // Group convocations by match
  const groupedByMatch = convocations.reduce(
    (acc, conv) => {
      const matchId = conv.match_id;
      if (!acc[matchId]) {
        acc[matchId] = { match: conv.championship_matches, players: [] };
      }
      acc[matchId].players.push(conv);
      return acc;
    },
    {} as Record<string, { match: any; players: Convocation[] }>
  );

  const totalConvocations = convocations.length;
  const uniquePlayers = new Set(convocations.map((c) => c.user_id)).size;
  const uniqueMatches = new Set(convocations.map((c) => c.match_id)).size;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">📋 Riepilogo Convocazioni</h1>
        <p className="text-gray-600 mt-2">Visualizza e filtra le convocazioni per le partite di campionato</p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campionato</label>
            <select
              value={championshipId}
              onChange={(e) => setChampionshipId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona campionato</option>
              {championships.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Squadra</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutte le squadre</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data dal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data al</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-600">
          <p className="text-sm text-blue-700">Totale Convocazioni</p>
          <p className="text-3xl font-bold text-blue-800">{totalConvocations}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-600">
          <p className="text-sm text-green-700">Giocatori Convocati</p>
          <p className="text-3xl font-bold text-green-800">{uniquePlayers}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 border-l-4 border-purple-600">
          <p className="text-sm text-purple-700">Partite Coperte</p>
          <p className="text-3xl font-bold text-purple-800">{uniqueMatches}</p>
        </div>
      </div>

      {/* RESULTS */}
      {loading ? (
        <div className="text-center text-gray-600 py-8">Caricamento...</div>
      ) : Object.keys(groupedByMatch).length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-l-4 border-gray-600 p-6 text-center text-gray-800">
          Nessuna convocazione trovata con i filtri selezionati
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMatch).map(([matchId, { match, players }]) => (
            <div key={matchId} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-600">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {match?.championship_teams?.name || "—"} vs {match?.opponent_name || "—"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {match?.scheduled_start_at
                        ? new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "—"}{" "}
                      •{" "}
                      {match?.scheduled_start_at
                        ? new Date(match.scheduled_start_at).toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">
                      {players.length} convocati
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giocatore</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Convocazione</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((conv, idx) => (
                      <tr key={conv.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {conv.profiles?.full_name || "Sconosciuto"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(conv.convocated_at).toLocaleDateString("it-IT", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{conv.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
