"use client";

import { useState, useEffect, useCallback } from "react";
import { useAthletesSearch } from "@/hooks/use-athletes-search";
import AthleteCard from "./athlete-card";

export default function AthleteSearch() {
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"M" | "F" | undefined>();
  const { results, isLoading, error, search } = useAthletesSearch();

  // Ricerca live con debounce
  useEffect(() => {
    if (query.length < 4) {
      return;
    }

    const timer = setTimeout(() => {
      search(query, genderFilter);
    }, 400); // debounce 400ms

    return () => clearTimeout(timer);
  }, [query, genderFilter, search]);

  const handleClearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">🏓 Risultati Atleti</h1>
        <p className="text-slate-600">
          Cerca un atleta nella classifica regionale lombarda
        </p>
      </div>

      {/* RICERCA */}
      <div className="mx-auto max-w-2xl space-y-3">
        {/* Input ricerca */}
        <div className="relative">
          <input
            type="text"
            placeholder="Digita nome atleta... (min. 2 caratteri)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-full"
            autoFocus
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Cancella ricerca"
            >
              ✕
            </button>
          )}
        </div>

        {/* FILTRI GENERE */}
        <div className="flex gap-2">
          <button
            onClick={() => setGenderFilter(undefined)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              !genderFilter
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            👥 Tutti
          </button>
          <button
            onClick={() => setGenderFilter("M")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              genderFilter === "M"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🧑‍🦰 Maschile
          </button>
          <button
            onClick={() => setGenderFilter("F")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              genderFilter === "F"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            👩 Femminile
          </button>
        </div>
      </div>

      {/* RISULTATI */}
      {query.length >= 4 && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-600">
              ⏳ Ricerca su portale FITET in corso...
            </div>
          ) : error ? (
            <div className="rounded-lg bg-amber-50 p-4 text-center text-amber-800 border border-amber-200">
              ⚠️ {error}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-slate-600">
                <strong>{results.length}</strong> atleta{results.length !== 1 ? "i" : ""} trovato{results.length !== 1 ? "i" : ""} · Fonte: {results[0]?.source === "fitet_live" ? "🔴 FITET Live" : "📦 Cache"}
              </div>

              {/* GRID RISULTATI */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* SUGGERIMENTO INIZIALE */}
      {query.length === 0 && (
        <div className="rounded-lg bg-blue-50 p-6 text-center border border-blue-200">
          <p className="text-slate-600 mb-2">
            Digita almeno 4 caratteri per cercare dal portale FITET
          </p>
          <p className="text-sm text-slate-500">
            Esempi: "FANTONI", "MATTEO", "WANG", "ROSSI"
          </p>
        </div>
      )}

      {/* WARNING: query 2-3 caratteri */}
      {query.length > 0 && query.length < 4 && (
        <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-600 border border-slate-200">
          Digita altri {4 - query.length} carattere{4 - query.length > 1 ? "i" : ""} per avviare la ricerca...
        </div>
      )}
    </div>
  );
}
