"use client";

import { useRouter, usePathname } from "next/redirect";
import type { Season } from "@/lib/types";

export default function SeasonFilter({
  seasons,
  selectedSeasonId,
}: {
  seasons: Season[];
  selectedSeasonId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mb-4 flex items-center gap-2">
      <label className="label m-0">Stagione</label>
      <select
        className="input w-auto"
        value={selectedSeasonId}
        onChange={(e) => router.push(`${pathname}?season=${e.target.value}`)}
      >
        <option value="all">Tutte le stagioni</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.is_current ? " (corrente)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
