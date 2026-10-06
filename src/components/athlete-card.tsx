"use client";

import { useState } from "react";
import { type Athlete, formatBirthDate, getAge, getFitetProfileUrl } from "@/lib/fitet-data";

interface AthleteCardProps {
  athlete: Athlete;
}

export default function AthleteCard({ athlete }: AthleteCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const genderLabel = athlete.gender === "M" ? "Maschile" : "Femminile";
  const fitetUrl = getFitetProfileUrl(athlete);

  // Gestisci caso quando dateOfBirth non è disponibile (da API FITET)
  const birthDate = athlete.dateOfBirth ? formatBirthDate(athlete.dateOfBirth) : null;
  const age = athlete.dateOfBirth ? getAge(athlete.dateOfBirth) : null;

  const handleDetailsClick = async () => {
    setIsLoading(true);

    try {
      // Prova a ottenere il link diretto al profilo
      const response = await fetch(
        `/api/fitet/athlete-profile?name=${encodeURIComponent(athlete.name)}&gender=${athlete.gender}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.profileUrl) {
          // Apri il profilo diretto
          window.open(data.profileUrl, "_blank");
          return;
        }
      }
    } catch (error) {
      console.error("[AthleteCard] Failed to fetch profile URL:", error);
    } finally {
      setIsLoading(false);
    }

    // Fallback: apri l'URL standard (ricerca)
    window.open(fitetUrl, "_blank");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-lg transition flex flex-col">
      {/* NOME */}
      <h3 className="mb-3 font-semibold text-slate-900 line-clamp-2">
        {athlete.name}
      </h3>

      {/* DATA DI NASCITA */}
      {birthDate && age ? (
        <div className="mb-4 text-sm text-slate-600">
          📅 {birthDate} ({age} anni)
        </div>
      ) : (
        <div className="mb-4 text-xs text-slate-400">
          📅 Data non disponibile
        </div>
      )}

      {/* BOTTONE DETTAGLI */}
      <button
        onClick={handleDetailsClick}
        disabled={isLoading}
        className="mt-auto block w-full rounded-md bg-blue-600 py-2 px-3 text-center text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Caricamento..." : "Dettagli Completi →"}
      </button>
    </div>
  );
}
