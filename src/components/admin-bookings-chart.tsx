"use client";

import { useMemo, useState } from "react";
import type { Booking } from "@/lib/types";

type PeriodFilter = "this_month" | "last_month" | "next_month" | "custom";

interface DateRange {
  from: string;
  to: string;
}

const MONTHS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

function getMonthRange(offset: number): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;

  const actualMonth = ((month % 12) + 12) % 12;
  const actualYear = year + Math.floor(month / 12);

  const from = new Date(actualYear, actualMonth, 1);
  const to = new Date(actualYear, actualMonth + 1, 0);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function aggregateByDay(
  bookings: Booking[],
  fromDate: string,
  toDate: string
): { date: string; active: number; cancelled: number }[] {
  const data: Record<string, { active: number; cancelled: number }> = {};

  for (const b of bookings) {
    if (b.session_date < fromDate || b.session_date > toDate) continue;

    if (!data[b.session_date]) {
      data[b.session_date] = { active: 0, cancelled: 0 };
    }

    if (b.status === "cancelled") {
      data[b.session_date].cancelled++;
    } else {
      data[b.session_date].active++;
    }
  }

  const result = Object.entries(data)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

export default function AdminBookingsChart({
  bookings,
}: {
  bookings: Booking[];
}) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this_month");
  const [customRange, setCustomRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0],
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
    };
  });

  const dateRange = useMemo(() => {
    if (periodFilter === "this_month") return getMonthRange(0);
    if (periodFilter === "last_month") return getMonthRange(-1);
    if (periodFilter === "next_month") return getMonthRange(1);
    return customRange;
  }, [periodFilter, customRange]);

  const data = useMemo(
    () => aggregateByDay(bookings, dateRange.from, dateRange.to),
    [bookings, dateRange]
  );

  const totalActive = data.reduce((sum, d) => sum + d.active, 0);
  const totalCancelled = data.reduce((sum, d) => sum + d.cancelled, 0);
  const maxCount = Math.max(1, ...data.map((d) => d.active + d.cancelled));

  const periodLabel = useMemo(() => {
    if (periodFilter === "this_month") return "Questo mese";
    if (periodFilter === "last_month") return "Mese scorso";
    if (periodFilter === "next_month") return "Prossimo mese";
    return `${dateRange.from} → ${dateRange.to}`;
  }, [periodFilter, dateRange]);

  return (
    <div className="card">
      <h3 className="mb-4 font-semibold text-amber-700">Andamento prenotazioni</h3>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setPeriodFilter("this_month")}
          className={`px-3 py-1 text-sm rounded ${
            periodFilter === "this_month"
              ? "bg-navy-600 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Questo mese
        </button>
        <button
          onClick={() => setPeriodFilter("last_month")}
          className={`px-3 py-1 text-sm rounded ${
            periodFilter === "last_month"
              ? "bg-navy-600 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Mese scorso
        </button>
        <button
          onClick={() => setPeriodFilter("next_month")}
          className={`px-3 py-1 text-sm rounded ${
            periodFilter === "next_month"
              ? "bg-navy-600 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Prossimo mese
        </button>
        <button
          onClick={() => setPeriodFilter("custom")}
          className={`px-3 py-1 text-sm rounded ${
            periodFilter === "custom"
              ? "bg-navy-600 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Custom
        </button>
      </div>

      {periodFilter === "custom" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <div>
            <label className="label text-xs">Da</label>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                setCustomRange({ ...customRange, from: e.target.value })
              }
              className="input w-32 text-sm"
            />
          </div>
          <div>
            <label className="label text-xs">A</label>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                setCustomRange({ ...customRange, to: e.target.value })
              }
              className="input w-32 text-sm"
            />
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="text-sm">
          <span className="text-slate-600">Periodo: </span>
          <span className="font-medium">{periodLabel}</span>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-slate-600">Attive: </span>
            <span className="font-semibold text-navy-700">{totalActive}</span>
          </div>
          <div>
            <span className="text-slate-600">Cancellate: </span>
            <span className="font-semibold text-red-700">{totalCancelled}</span>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1" style={{ height: 200, minWidth: "100%" }}>
            {data.map(({ date, active, cancelled }) => {
              const total = active + cancelled;
              return (
                <div
                  key={date}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                  title={`${date}: ${active} attive, ${cancelled} cancellate`}
                >
                  <span className="text-[10px] text-slate-600">
                    {total || ""}
                  </span>
                  <div
                    className="w-full bg-red-400"
                    style={{ height: `${(cancelled / maxCount) * 100}px` }}
                  />
                  <div
                    className="w-full rounded-t bg-navy-500"
                    style={{ height: `${(active / maxCount) * 100}px` }}
                  />
                  <span className="text-[10px] text-slate-500">
                    {date.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          Nessuna prenotazione nel periodo selezionato
        </p>
      )}
    </div>
  );
}
