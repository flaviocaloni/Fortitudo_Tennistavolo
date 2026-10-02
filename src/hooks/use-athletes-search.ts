import { useState, useCallback } from "react";

export type Athlete = {
  id: string;
  name: string;
  ranking: number;
  gender: "M" | "F";
  category: string;
  source: "mock" | "fitet_live" | "fitet_fallback";
  dateOfBirth?: string; // YYYY-MM-DD
};

export function useAthletesSearch() {
  const [results, setResults] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const search = useCallback(
    async (query: string, gender?: "M" | "F") => {
      // Minimo 4 caratteri
      if (!query || query.length < 4) {
        setResults([]);
        setError(null);
        setLastQuery(query);
        return;
      }

      if (query === lastQuery) {
        return; // Evita ricerche duplicate
      }

      setIsLoading(true);
      setError(null);
      setLastQuery(query);

      try {
        const response = await fetch("/api/fitet/search-athletes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, gender }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setResults(data.athletes || []);

        if (data.athletes?.length === 0) {
          setError(`Nessun atleta trovato per "${query}"`);
        }
      } catch (err) {
        console.error("[Search Error]", err);
        setError(
          err instanceof Error
            ? err.message
            : "Errore nella ricerca. Riprova più tardi."
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [lastQuery]
  );

  return { results, isLoading, error, search };
}
