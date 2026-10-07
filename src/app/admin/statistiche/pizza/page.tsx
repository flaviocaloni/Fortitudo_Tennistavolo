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
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<PizzaSlotDetail[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PizzaSlotDetail | null>(null);
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Ricerca slot
  useEffect(() => {
    if (!searchName.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const loadResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/pizza-details?name=${encodeURIComponent(searchName)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setHasSearched(true);
        }
      } catch (error) {
        console.error("Error loading search results:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [searchName]);

  // Carica prenotazioni quando uno slot è selezionato
  useEffect(() => {
    if (!selectedSlot) {
      setBookings([]);
      return;
    }

    const loadBookings = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/pizza-bookings?slot_id=${selectedSlot.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (error) {
        console.error("Error loading bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [selectedSlot]);

  const totalBookings = bookings.length;
  const totalParticipants = bookings.reduce((sum, b) => sum + (b.selected_participants || 1), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">🍕 Statistiche Pizza</h1>
        <p className="text-gray-600 mt-2">Ricerca uno slot e visualizza prenotazioni e partecipanti</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-orange-600">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ricerca Slot Pizza</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome Slot</label>
          <input
            type="text"
            placeholder="Digita il nome dello slot pizza..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="mt-4">
            {loading ? (
              <p className="text-gray-600">Caricamento risultati...</p>
            ) : searchResults.length === 0 ? (
              <p className="text-gray-600">Nessuno slot trovato</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">{searchResults.length} risultato/i trovato/i:</p>
                {searchResults.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedSlot?.id === slot.id
                        ? "border-orange-600 bg-orange-50"
                        : "border-gray-300 bg-white hover:border-orange-400"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{slot.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(slot.pizza_date + "T00:00:00").toLocaleDateString("it-IT")} •{" "}
                      {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Section - shown only when a slot is selected */}
      {selectedSlot && (
        <>
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

          {/* Slot Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-orange-600">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettaglio Slot</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Nome</p>
                <p className="font-medium text-gray-900">{selectedSlot.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Data</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedSlot.pizza_date + "T00:00:00").toLocaleDateString("it-IT")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Orario</p>
                <p className="font-medium text-gray-900">
                  {formatTime(selectedSlot.start_time)}–{formatTime(selectedSlot.end_time)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Prenotazioni</p>
                <p className="font-medium text-gray-900">{selectedSlot.bookings_count}</p>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-600">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900">Elenco Prenotazioni</h2>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-600">Caricamento prenotazioni...</div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-600">Nessuna prenotazione per questo slot</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Utente</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
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
        </>
      )}

      {/* No selection message */}
      {hasSearched && !selectedSlot && searchResults.length > 0 && (
        <div className="bg-blue-50 rounded-lg border-l-4 border-blue-600 p-6 text-center text-blue-800">
          Seleziona uno slot dalla ricerca per visualizzare i dettagli
        </div>
      )}

      <div className="mt-8">
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
