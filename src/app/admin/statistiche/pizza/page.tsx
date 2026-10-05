"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatTime } from "@/lib/dates";
import type { PizzaSlotDetail } from "@/lib/supabase/pizza-stats";

export const dynamic = "force-dynamic";

export default function PizzaStatistichePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; date?: string }>;
}) {
  const [slots, setSlots] = useState<PizzaSlotDetail[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<PizzaSlotDetail[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        const res = await fetch(`/api/admin/pizza-details?name=${encodeURIComponent(searchName)}&date=${encodeURIComponent(searchDate)}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data);
          setFilteredSlots(data);
        }
      } catch (error) {
        console.error("Error loading pizza slots:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [searchName, searchDate]);

  const totalBookings = filteredSlots.reduce((sum, s) => sum + s.bookings_count, 0);
  const totalParticipants = filteredSlots.reduce((sum, s) => sum + s.total_participants, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">🍕 Statistiche Pizza</h1>
        <p className="text-gray-600 mt-2">Dettaglio slot pizza, prenotazioni e partecipanti</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-4 border-l-4 border-orange-600">
          <p className="text-sm text-orange-700">Prenotazioni</p>
          <p className="text-3xl font-bold text-orange-800">{totalBookings}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-4 border-l-4 border-amber-600">
          <p className="text-sm text-amber-700">N. Partecipanti</p>
          <p className="text-3xl font-bold text-amber-800">{totalParticipants}</p>
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-orange-600">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ricerca</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Slot</label>
            <input
              type="text"
              placeholder="Cerca per nome..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-orange-600">
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
          <h2 className="text-lg font-semibold text-gray-900">Dettaglio Slot Pizza</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Caricamento...</div>
        ) : filteredSlots.length === 0 ? (
          <div className="p-6 text-center text-gray-600">Nessuno slot pizza trovato</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome Slot</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orario</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Prenotazioni</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Partecipanti</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((slot, idx) => (
                  <tr key={slot.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">{slot.title}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                        {new Date(slot.pizza_date + "T00:00:00").toLocaleDateString("it-IT")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {slot.bookings_count}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                        {slot.total_participants}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/admin/slot/pizza"
          className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          Gestisci Slot Pizza →
        </Link>
      </div>
    </div>
  );
}
