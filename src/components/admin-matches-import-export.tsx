"use client";

import { useState } from "react";
import { importMatches, exportMatches } from "@/lib/actions/championships";

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  team_id: string;
  opponent_name: string;
  scheduled_start_at: string;
  scheduled_end_at?: string;
  location?: string;
  result_team_score?: number;
  result_opponent_score?: number;
  status?: string;
  notes?: string;
}

interface ImportPreviewMatch {
  rowNumber: number;
  team_name?: string;
  opponent_name: string;
  opponent_club_name?: string;
  scheduled_start_at: string;
  leg_type?: string;
  venue_type?: string;
  venue_name?: string;
  address?: string;
  notes?: string;
  team_id?: string;
  error?: string;
}

export default function ImportExportClient({
  championshipId,
  teams,
  existingMatches,
}: {
  championshipId: string;
  teams: Team[];
  existingMatches: Match[];
}) {
  const [csvContent, setCsvContent] = useState("");
  const [previewData, setPreviewData] = useState<ImportPreviewMatch[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const parseCSV = (content: string): ImportPreviewMatch[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const results: ImportPreviewMatch[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.every((v) => !v)) continue;

      const teamName = values[headers.indexOf("squadra")];
      const opponentName = values[headers.indexOf("avversario")];
      const opponentClubName = values[headers.indexOf("società avversaria")] || values[headers.indexOf("societa avversaria")];
      const dateStr = values[headers.indexOf("data e ora")] || values[headers.indexOf("data")];
      const timeStr = values[headers.indexOf("ora")];
      const legType = values[headers.indexOf("tipo gara")] || "SINGLE";
      const venueType = values[headers.indexOf("sede")] || "HOME";
      const venueName = values[headers.indexOf("luogo")];
      const address = values[headers.indexOf("indirizzo")];
      const notes = values[headers.indexOf("note")];

      // Find team by name
      const team = teams.find((t) => t.name.toLowerCase() === teamName?.toLowerCase());

      // Normalize venue type
      const normalizedVenueType = venueType?.toLowerCase().includes("casa") || venueType?.toLowerCase().includes("home") ? "HOME" :
                                  venueType?.toLowerCase().includes("trasferta") || venueType?.toLowerCase().includes("away") ? "AWAY" : "HOME";

      // Combine date and time if separate
      let scheduledStartAt = dateStr;
      if (timeStr && dateStr) {
        scheduledStartAt = `${dateStr}T${timeStr}`;
      }

      let error = "";
      if (!teamName) error = "Squadra mancante";
      else if (!team) error = `Squadra "${teamName}" non trovata`;
      if (!opponentName) error = error ? error + "; Avversario mancante" : "Avversario mancante";
      if (!dateStr) error = error ? error + "; Data mancante" : "Data mancante";

      results.push({
        rowNumber: i + 1,
        team_name: teamName,
        opponent_name: opponentName || "",
        opponent_club_name: opponentClubName,
        scheduled_start_at: scheduledStartAt || "",
        leg_type: legType,
        venue_type: normalizedVenueType,
        venue_name: venueName,
        address,
        notes,
        team_id: team?.id,
        error: error || undefined,
      });
    }

    return results;
  };

  const handlePreview = () => {
    setError("");
    const preview = parseCSV(csvContent);
    setPreviewData(preview);
    setShowPreview(true);
  };

  const handleImport = async () => {
    if (previewData.some((p) => p.error)) {
      setError("Impossibile importare: ci sono righe con errori. Correggi il CSV e riprova.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("championshipId", championshipId);
      formData.append("matches", JSON.stringify(previewData));

      const result = await importMatches(formData);

      if (result.success) {
        setSuccessMessage(`✓ ${result.imported} partite importate con successo!`);
        setCsvContent("");
        setPreviewData([]);
        setShowPreview(false);
      } else {
        setError(`Errore durante l'importazione: ${result.error}`);
      }
    } catch (err) {
      setError(`Errore: ${err instanceof Error ? err.message : "Errore sconosciuto"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const result = await exportMatches(championshipId);

      if (result.success && result.csvContent) {
        // Create blob and trigger download
        const blob = new Blob([result.csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `partite_${championshipId}_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSuccessMessage("✓ File esportato con successo!");
      } else {
        setError(`Errore durante l'esportazione: ${result.error}`);
      }
    } catch (err) {
      setError(`Errore: ${err instanceof Error ? err.message : "Errore sconosciuto"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">Errore:</p>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {/* EXPORT SECTION */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📥 Esporta Partite</h2>
        <p className="text-gray-600 mb-4">
          Esporta tutte le {existingMatches.length} partite del campionato in formato CSV.
        </p>
        <button
          onClick={handleExport}
          disabled={isLoading}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {isLoading ? "Esportazione in corso..." : "Scarica CSV"}
        </button>
      </div>

      {/* IMPORT SECTION */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📤 Importa Partite</h2>

        {!showPreview ? (
          <>
            <p className="text-gray-600 mb-4">
              Incolla il contenuto CSV con le colonne: Squadra*, Avversario*, Data e Ora*, Tipo Gara, Sede, Luogo, Indirizzo, Società Avversaria, Note
              <br />
              <span className="text-xs text-gray-500">(*) Campi obbligatori</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">CSV Content</label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                placeholder="Squadra,Avversario,Data e Ora,Tipo Gara,Sede,Luogo,Indirizzo,Società Avversaria,Note&#10;YoungTeam,FC Milano,2026-09-21 19:00,SINGLE,HOME,Campo A,Via Roma 1,FC Milano SRL,Amichevole"
              />
            </div>
            <button
              onClick={handlePreview}
              disabled={!csvContent.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Anteprima
            </button>
          </>
        ) : (
          <>
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-2 py-2 text-left font-semibold">Riga</th>
                    <th className="px-2 py-2 text-left font-semibold">Squadra</th>
                    <th className="px-2 py-2 text-left font-semibold">Avversario</th>
                    <th className="px-2 py-2 text-left font-semibold">Società</th>
                    <th className="px-2 py-2 text-left font-semibold">Data/Ora</th>
                    <th className="px-2 py-2 text-left font-semibold">Tipo Gara</th>
                    <th className="px-2 py-2 text-left font-semibold">Sede</th>
                    <th className="px-2 py-2 text-left font-semibold">Luogo</th>
                    <th className="px-2 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row) => (
                    <tr key={row.rowNumber} className={row.error ? "bg-red-50 border-b" : "border-b"}>
                      <td className="px-2 py-2 font-semibold">{row.rowNumber}</td>
                      <td className="px-2 py-2">{row.team_name}</td>
                      <td className="px-2 py-2">{row.opponent_name}</td>
                      <td className="px-2 py-2 text-gray-600">{row.opponent_club_name || "—"}</td>
                      <td className="px-2 py-2">{row.scheduled_start_at}</td>
                      <td className="px-2 py-2 text-center">{row.leg_type || "SINGLE"}</td>
                      <td className="px-2 py-2 text-center font-semibold">{row.venue_type || "HOME"}</td>
                      <td className="px-2 py-2 text-gray-600">{row.venue_name || "—"}</td>
                      <td className="px-2 py-2">
                        {row.error ? (
                          <span className="text-red-700 text-xs font-semibold">❌ {row.error}</span>
                        ) : (
                          <span className="text-green-700 text-xs font-semibold">✓ OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Modifica CSV
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || previewData.some((p) => p.error)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? "Importazione in corso..." : `Conferma Importazione (${previewData.filter((p) => !p.error).length} partite)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
