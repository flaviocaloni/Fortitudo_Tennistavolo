"use client";

import { useRouter } from "next/navigation";

type EventFilter = "all" | "future" | "past";

export default function EventsFilterClient({ currentFilter }: { currentFilter: EventFilter }) {
  const router = useRouter();

  const handleFilterChange = (filter: EventFilter) => {
    router.push(`?filter=${filter}`, { scroll: false });
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {(["future", "past", "all"] as const).map((f) => (
        <button
          key={f}
          onClick={() => handleFilterChange(f)}
          className={`btn ${
            currentFilter === f
              ? "btn-navy"
              : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
          }`}
        >
          {f === "future" && "📅 Futuri"}
          {f === "past" && "📆 Passati"}
          {f === "all" && "📋 Tutti"}
        </button>
      ))}
    </div>
  );
}
