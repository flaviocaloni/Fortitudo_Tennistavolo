"use client";

import { PizzaStats } from "@/lib/supabase/pizza-stats";

export default function PizzaStatsCard({ stats }: { stats: PizzaStats }) {
  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
      <h3 className="mb-4 flex items-center text-lg font-semibold text-amber-900">
        🍕 Statistiche Pizza
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-slate-600">Slot Pizza</p>
          <p className="text-2xl font-bold text-amber-700">{stats.totalPizzas}</p>
        </div>

        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-slate-600">Prenotazioni</p>
          <p className="text-2xl font-bold text-orange-700">{stats.totalBookings}</p>
        </div>

        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-slate-600">Medio Partecipanti</p>
          <p className="text-2xl font-bold text-amber-700">{stats.avgParticipants}</p>
        </div>

        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-slate-600">In Calendario</p>
          <p className="text-2xl font-bold text-green-700">{stats.upcomingPizzas}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-amber-200 pt-3">
        <p className="text-xs text-slate-600">
          <span className="font-medium text-slate-700">{stats.pastPizzas}</span> pizza completate
        </p>
      </div>
    </div>
  );
}
