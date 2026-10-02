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
    <div className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-lg transition">
      {/* RANK BADGE */}
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
          <span className="text-lg font-bold text-blue-700">#{athlete.ranking}</span>
        </div>
        <div className="text-xs font-medium text-slate-500 uppercase">
          {genderLabel}
        </div>
      </div>

      {/* FOTO (PLACEHOLDER) */}
      <div className="mb-3 flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 py-8">
        <div className="text-4xl">
          {athlete.gender === "M" ? "🧑‍🤝‍🧑" : "👩‍🤝‍👩"}
        </div>
      </div>

      {/* NOME */}
      <h3 className="mb-2 text-center font-semibold text-slate-900 line-clamp-2">
        {athlete.name}
      </h3>

      {/* INFO */}
      <div className="space-y-1 text-center text-sm text-slate-600 mb-4">
        {birthDate && age ? (
          <div>
            📅 {birthDate}
            <br />
            <span className="text-xs text-slate-500">({age} anni)</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            📅 Data non disponibile
          </div>
        )}
      </div>

      {/* CATEGORIA */}
      <div className="mb-4 text-center">
        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
          {athlete.category}
        </span>
      </div>

      {/* BOTTONE DETTAGLI */}
      <Link
        href={fitetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-md bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition"
      >
        Dettagli Completi →
      </Link>
    </div>
  );
}
