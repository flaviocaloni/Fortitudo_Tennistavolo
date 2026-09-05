"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Participant {
  full_name: string;
  role: string;
  is_overbooking: boolean;
}

export default function SlotParticipantsModal({
  slotId,
  sessionDate,
  maxCapacity,
  occupiedSeats,
}: {
  slotId: string;
  sessionDate: string;
  maxCapacity: number;
  occupiedSeats: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    const supabase = createClient();
    // SECURITY DEFINER RPC: the `bookings read` RLS restricts non-admins to their
    // own rows, so a direct query showed only the logged-in user. The RPC returns
    // the full participant list with names for any authenticated user.
    const { data, error } = await supabase.rpc("get_slot_participants", {
      slot_id_param: slotId,
      session_date_param: sessionDate,
    });

    if (data) {
      setParticipants(
        (data as any[]).map((b: any) => ({
          full_name: b.full_name || "—",
          role: b.role || "—",
          is_overbooking: b.is_overbooking,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen, slotId, sessionDate]);

  const confirmed = participants.filter((p) => !p.is_overbooking);
  const waitlist = participants.filter((p) => p.is_overbooking);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          fetchParticipants();
        }}
        className="text-sm text-blue-600 hover:underline"
      >
        {occupiedSeats}/{maxCapacity}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-sm overflow-y-auto max-h-96">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-navy-800">Partecipanti</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {loading && <p className="text-sm text-slate-500">Caricamento...</p>}

            {!loading && (
              <>
                {confirmed.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold text-slate-600">
                      Confermati ({confirmed.length}/{maxCapacity})
                    </p>
                    <div className="space-y-1">
                      {confirmed.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span>{p.full_name}</span>
                          <span className="text-slate-500">{p.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {waitlist.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-amber-600">
                      Lista d'attesa ({waitlist.length})
                    </p>
                    <div className="space-y-1">
                      {waitlist.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs opacity-75">
                          <span>{p.full_name}</span>
                          <span className="text-slate-500">{p.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {participants.length === 0 && (
                  <p className="text-center text-sm text-slate-500">Nessun partecipante</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
