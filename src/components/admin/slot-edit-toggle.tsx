"use client";

import { useState } from "react";
import type { Season, TrainingSlot } from "@/lib/types";
import SlotForm from "@/components/admin/slot-form";

export default function SlotEditToggle({
  slot,
  action,
  seasons,
}: {
  slot: TrainingSlot;
  action: (formData: FormData) => Promise<void>;
  seasons: Season[];
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button className="btn-ghost" onClick={() => setEditing(true)}>
        Modifica
      </button>
    );
  }

  return (
    <div className="mt-3 w-full">
      <SlotForm action={action} seasons={seasons} slot={slot} submitLabel="Salva modifiche" />
      <button className="btn-ghost mt-2" onClick={() => setEditing(false)}>
        Chiudi
      </button>
    </div>
  );
}
