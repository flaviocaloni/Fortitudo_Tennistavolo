"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatTime } from "@/lib/dates";
import type { PizzaSlotDetail } from "@/lib/supabase/pizza-stats";

interface BookingDetail {
  id: string;
  user_name: string;
  user_email: string;
  session_date: string;
  selected_participants: number;
  slot_title: string;
  start_time: string;
  end_time: string;
}

export const dynamic = "force-dynamic";

export default function PizzaStatistichePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; date?: string }>;
}) {
  const [slots, setSlots] = useState<PizzaSlotDetail[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<PizzaSlotDetail[]>([]);
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [slotsRes, bookingsRes] = await Promise.all([
          fetch(`/api/admin/pizza-details?name=${encodeURIComponent(searchName)}&date=${encodeURIComponent(searchDate)}`),
          fetch(`/api/admin/pizza-bookings?name=${encodeURIComponent(searchName)}&date=${encodeURIComponent(searchDate)}`),
        ]);

        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          setSlots(slotsData);
          setFilteredSlots(slotsData);
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }
      } catch (error) {
        console.error("Error loading pizza data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchName, searchDate]);

  const totalBookings = bookings.length;
  const totalParticipants = bookings.reduce((sum, b) => sum + (b.selected_participants || 1), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">🍕 Statistiche Pizza</h1>
        <p className="text-gray-600 mt-2">Dettaglio slot pizza, prenotazioni e partecipanti</p>
      </div>

      {/* Search Filters - FIRST */}
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

      {/* Summary Cards - Connected to search */}
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

      {/* Slot Details Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-orange-600 mb-8">
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

      {/* Bookings Details Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-600 mb-8">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900">Elenco Prenotazioni</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Caricamento...</div>
        ) : bookings.length === 0 ? (
          <div className="p-6 text-center text-gray-600">Nessuna prenotazione trovata</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slot Pizza</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orario</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Partecipanti</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, idx) => (
                  <tr key={booking.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">{booking.user_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{booking.user_email}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">{booking.slot_title}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {new Date(booking.session_date + "T00:00:00").toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {formatTime(booking.start_time)}–{formatTime(booking.end_time)}
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                        {booking.selected_participants || 1}
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
