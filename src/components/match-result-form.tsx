"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMatchResult } from "@/lib/actions/championships";

export default function MatchResultForm({
  matchId,
  championshipId,
  currentResult,
  isEditable,
}: {
  matchId: string;
  championshipId: string;
  currentResult?: string;
  isEditable: boolean;
}) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentResult) {
      const [home, away] = currentResult.split("-");
      setHomeScore(home);
      setAwayScore(away);
    }
  }, [currentResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!homeScore || !awayScore) {
      setError("Punteggi obbligatori");
      return;
    }

    const home = parseInt(homeScore, 10);
    const away = parseInt(awayScore, 10);

    if (home + away !== 7) {
      setError(
        `La somma dei punteggi deve essere 7 (attuale: ${home + away}). Risultato non valido.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("match_id", matchId);
      formData.append("championship_id", championshipId);
      formData.append("home_score", homeScore);
      formData.append("away_score", awayScore);

      await updateMatchResult(formData);

      setSuccess("✅ Risultato salvato!");
      setError("");

      // Refresh pagina dopo 500ms per mostrare i valori
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Errore durante il salvataggio");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditable) return null;

  return (
    <div className="mt-6 pt-6 border-t">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {currentResult ? "Modifica Risultato" : "Inserisci Risultato"}
      </h3>

      {/* ERROR POPUP */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-lg font-bold">⚠️</span>
            <div>
              <h4 className="text-red-900 font-semibold mb-1">Errore</h4>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800 ml-auto"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-lg font-bold">{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="text-green-600 hover:text-green-800 ml-auto"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Punteggio nostro *
          </label>
          <select
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          >
            <option value="">Seleziona</option>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <span className="text-lg font-bold text-gray-700">-</span>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Punteggio avversario *
          </label>
          <select
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          >
            <option value="">Seleziona</option>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-lg text-white font-medium transition ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isSubmitting
            ? "Salvataggio..."
            : currentResult
              ? "Aggiorna Risultato"
              : "Salva Risultato"}
        </button>
      </form>
    </div>
  );
}
