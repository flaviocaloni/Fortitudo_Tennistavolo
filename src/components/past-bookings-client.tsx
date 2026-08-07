"use client";

import { useState } from "react";
import { formatDateIT, formatTime } from "@/lib/dates";

interface PastBooking {
  id: string;
  session_date: string;
  status: string;
  training_slots?: { title: string; start_time: string; end_time: string } | null;
}

export default function PastBookingsClient({ bookings }: { bookings: PastBooking[] }) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="btn-ghost">
        Visualizza storico ({bookings.length})
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {bookings.map((b) => (
        <div key={b.id} className="card flex items-center justify-between opacity-70">
          <div>
            <p className="font-medium capitalize">
              {formatDateIT(b.session_date)} — {b.training_slots?.title}
            </p>
            <p className="text-sm text-slate-600">
              {formatTime(b.training_slots?.start_time ?? "")}–
              {formatTime(b.training_slots?.end_time ?? "")}
            </p>
          </div>
          <span
            className={`badge ${
              b.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {b.status === "cancelled" ? "Cancellata" : "Completata"}
          </span>
        </div>
      ))}
      {bookings.length === 0 && (
        <p className="text-sm text-slate-500">Nessuna prenotazione passata.</p>
      )}
    </div>
  );
}
