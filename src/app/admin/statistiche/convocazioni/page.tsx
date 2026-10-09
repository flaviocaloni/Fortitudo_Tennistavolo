"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Convocation {
  id: string;
  match_id: string;
  user_id: string;
  convocated_at: string;
  profiles: { id: string; full_name: string; fitet_card_number: string | null } | null;
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
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
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

      // Set "Regionale Lombardia" as default
      if (data && data.length > 0) {
        const regionalLombardia = data.find((c: any) => c.name === "Regionale Lombardia");
        if (regionalLombardia) {
          setChampionshipId(regionalLombardia.id);
        } else if (data.length > 0) {
          setChampionshipId(data[0].id);
        }
      }
    };
    loadChampionships();
  }, []);

  // Load teams when championship changes
  useEffect(() => {
    if (!championshipId) {
      setTeams([]);
      return;
    }
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
  const handleSearch = async () => {
    if (!championshipId) return;
    setLoading(true);
    setError(null);

    try {
      console.log("Loading matches for championship:", championshipId);
      let matchQuery = supabase
        .from("championship_matches")
        .select("id, championship_id, team_id, scheduled_start_at, opponent_name, championship_teams:team_id(id, name)")
        .eq("championship_id", championshipId);

      if (teamId) {
        matchQuery = matchQuery.eq("team_id", teamId);
      }

      // Apply date filter to matches
      if (startDate) {
        matchQuery = matchQuery.gte("scheduled_start_at", startDate + "T00:00:00");
      }
      if (endDate) {
        matchQuery = matchQuery.lte("scheduled_start_at", endDate + "T23:59:59");
      }

      const { data: matches, error: matchError } = await matchQuery;

      if (matchError) {
        const errorMsg = `Errore caricamento partite: ${matchError.message}`;
        console.error(errorMsg, matchError);
        setError(errorMsg);
        setConvocations([]);
        setHasSearched(true);
        setLoading(false);
        return;
      }

      console.log("Matches loaded:", matches?.length || 0);

      if (!matches || matches.length === 0) {
        console.log("No matches found for this championship");
        setConvocations([]);
        setHasSearched(true);
        setLoading(false);
        return;
      }

      const matchIds = (matches || []).map((m: any) => m.id);

      // Load convocations for these matches (but don't filter by convocations)
      console.log("Loading convocations for matches:", matchIds.length);
      let convQuery = supabase
        .from("championship_match_convocations")
        .select("id, match_id, user_id, convocated_at, profiles!user_id(id, full_name, fitet_card_number)");

      const { data: convData, error: convError } = await convQuery;

      if (convError) {
        const errorMsg = `Errore caricamento convocazioni: ${convError.message}`;
        console.error(errorMsg, convError);
        setError(errorMsg);
        setConvocations([]);
      } else {
        console.log("Convocations loaded:", convData?.length || 0);

        // Create a map of convocations by match_id
        const convByMatch = new Map<string, any[]>();
        (convData || []).forEach((conv: any) => {
          if (matchIds.includes(conv.match_id)) {
            if (!convByMatch.has(conv.match_id)) {
              convByMatch.set(conv.match_id, []);
            }
            convByMatch.get(conv.match_id)!.push(conv);
          }
        });

        // Create convocation entries for all matches (even without convocations)
        const allConvocations: any[] = [];
        matchIds.forEach((matchId: string) => {
          const matchConvs = convByMatch.get(matchId) || [];
          const match = matches!.find((m: any) => m.id === matchId);

          if (matchConvs.length > 0) {
            matchConvs.forEach((conv: any) => {
              allConvocations.push({
                ...conv,
                championship_matches: match,
              });
            });
          } else {
            // Add empty entry for match with no convocations
            allConvocations.push({
              id: `empty-${matchId}`,
              match_id: matchId,
              user_id: null,
              convocated_at: null,
              profiles: null,
              championship_matches: match,
            });
          }
        });

        setConvocations(allConvocations);
        setError(null);
      }
    } catch (err) {
      const errorMsg = `Errore inaspettato: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMsg, err);
      setError(errorMsg);
      setConvocations([]);
    }

    setHasSearched(true);
    setLoading(false);
  };

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
  const availablePlayers = new Set(convocations.map((c) => c.user_id)).size;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campionato *</label>
            <select
              value={championshipId}
              onChange={(e) => {
                setChampionshipId(e.target.value);
                setTeamId("");
              }}
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

        <button
          onClick={handleSearch}
          disabled={!championshipId || loading}
          className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Caricamento..." : "Cerca"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 rounded-lg border-l-4 border-red-600 p-6 mb-8">
          <div className="flex items-start">
            <div className="text-red-600 font-bold mr-3">❌</div>
            <div>
              <h3 className="font-semibold text-red-800">Errore</h3>
              <p className="text-red-700 mt-1 font-mono text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-2">Apri la console (F12) per più dettagli</p>
            </div>
          </div>
        </div>
      )}

      {/* STATS - Only show after search */}
      {hasSearched && !error && (
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-600 inline-block">
            <p className="text-sm text-blue-700">Totale Convocazioni</p>
            <p className="text-3xl font-bold text-blue-800">{totalConvocations}</p>
          </div>
        </div>
      )}

      {/* RESULTS - Only show after search */}
      {!hasSearched ? (
        <div className="bg-gray-50 rounded-lg border-l-4 border-gray-600 p-6 text-center text-gray-800">
          Seleziona i filtri e clicca "Cerca" per visualizzare le convocazioni
        </div>
      ) : loading ? (
        <div className="text-center text-gray-600 py-8">Caricamento...</div>
      ) : error ? (
        <div className="text-center text-gray-600 py-8">Impossibile caricare i dati. Controlla l'errore sopra.</div>
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {match?.championship_teams?.name || "—"} vs {match?.opponent_name || "—"}
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-700 font-medium">
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
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giocatore</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tessera FITET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.length === 0 ? (
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                          Nessun convocato per questa partita
                        </td>
                      </tr>
                    ) : (
                      players.map((conv, idx) => (
                        <tr key={conv.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {conv.profiles?.full_name || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                            {conv.profiles?.fitet_card_number || "—"}
                          </td>
                        </tr>
                      ))
                    )}
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
