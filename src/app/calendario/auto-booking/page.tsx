"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toggleSlotAutoBooking } from "@/lib/actions/auto-booking";
import Toast from "@/components/toast";

const weekdayNames = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export default function AutoBookingPage() {
  const [loading, setLoading] = useState(true);
  const [autoBookingEnabled, setAutoBookingEnabled] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [userAutoBookings, setUserAutoBookings] = useState<Set<string>>(new Set());
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Check if auto-booking is enabled for this user
        const { data: autoBooking } = await supabase
          .from("user_auto_booking_enabled")
          .select("auto_booking_enabled")
          .eq("user_id", user.id)
          .single();

        if (!autoBooking?.auto_booking_enabled) {
          setError("Auto-booking non è abilitato per il tuo account. Contatta un superadmin.");
          setLoading(false);
          return;
        }

        setAutoBookingEnabled(true);

        // Get current season
        const { data: season } = await supabase
          .from("seasons")
          .select("id, name")
          .eq("is_current", true)
          .single();

        if (!season) {
          setError("Nessuna stagione corrente trovata");
          setLoading(false);
          return;
        }

        setCurrentSeason(season);

        // Get recurring slots for current season
        const { data: recurringSlots } = await supabase
          .from("training_slots")
          .select("id, title, weekday, start_time, end_time, audience")
          .eq("season_id", season.id)
          .not("weekday", "is", null)
          .eq("is_active", true)
          .order("weekday, start_time");

        if (recurringSlots) {
          setSlots(recurringSlots);
        }

        // Get user's auto-booking selections
        const { data: userBookings } = await supabase
          .from("user_slot_auto_booking")
          .select("slot_id, enabled")
          .eq("user_id", user.id);

        const enabledSlots = new Set(
          (userBookings || []).filter((ub: any) => ub.enabled).map((ub: any) => ub.slot_id)
        );
        setUserAutoBookings(enabledSlots);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, supabase]);

  const handleToggleSlot = async (slotId: string) => {
    const formData = new FormData();
    formData.append("slot_id", slotId);
    formData.append("enabled", (!userAutoBookings.has(slotId)).toString());

    try {
      await toggleSlotAutoBooking(formData);
      // Update local state optimistically
      const newAutoBookings = new Set(userAutoBookings);
      if (newAutoBookings.has(slotId)) {
        newAutoBookings.delete(slotId);
      } else {
        newAutoBookings.add(slotId);
      }
      setUserAutoBookings(newAutoBookings);
      setToast({
        message: newAutoBookings.has(slotId)
          ? "✅ Auto-booking attivato da domani"
          : "❌ Auto-booking disattivato",
        type: "success",
      });
      router.refresh();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Errore nel salvataggio",
        type: "error",
      });
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-center">Caricamento...</div>;
  }

  if (!autoBookingEnabled || error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || "Auto-booking non disponibile"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Auto-Booking Slot</h1>
      <p className="text-gray-600 mb-8">
        Seleziona gli slot ricorrenti che vuoi prenotare automaticamente ogni settimana
      </p>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slot</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giorno</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orario</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Audience</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Auto-Booking
              </th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot: any) => (
              <tr key={slot.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{slot.title}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {weekdayNames[slot.weekday] || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {slot.start_time} - {slot.end_time}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                    {slot.audience}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleSlot(slot.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      userAutoBookings.has(slot.id)
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {userAutoBookings.has(slot.id) ? "✅ Attivo" : "⭕ Disattivo"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {slots.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Nessuno slot ricorrente disponibile in questa stagione
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Come funziona</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Seleziona gli slot che vuoi auto-prenotare</li>
          <li>• Ogni giorno, il sistema automaticamente ti prenota le istanze per i prossimi 30 giorni</li>
          <li>• Puoi cambiare le selezioni in qualsiasi momento</li>
          <li>• Se disattivi uno slot, le prenotazioni future non verranno create (quelle passate rimangono)</li>
        </ul>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
