"use client";

import Link from "next/link";
import { type Athlete, formatBirthDate, getAge, getFitetProfileUrl } from "@/lib/fitet-data";

interface AthleteCardProps {
  athlete: Athlete;
}

export default function AthleteCard({ athlete }: AthleteCardProps) {
  const genderLabel = athlete.gender === "M" ? "Maschile" : "Femminile";
  const fitetUrl = getFitetProfileUrl(athlete);

  // Gestisci caso quando dateOfBirth non è disponibile (da API FITET)
  const birthDate = athlete.dateOfBirth ? formatBirthDate(athlete.dateOfBirth) : null;
  const age = athlete.dateOfBirth ? getAge(athlete.dateOfBirth) : null;

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
      <Link
        href={fitetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto block w-full rounded-md bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition"
      >
        Dettagli Completi →
      </Link>
    </div>
  );
}
