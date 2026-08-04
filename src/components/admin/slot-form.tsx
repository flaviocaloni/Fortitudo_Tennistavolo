"use client";

import { useState } from "react";
import { WEEKDAYS } from "@/lib/types";

export default function SlotForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [kind, setKind] = useState<"recurring" | "event">("recurring");

  return (
    <form action={action} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4">
        <label className="label">Tipo di slot</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={kind === "recurring" ? "btn-primary" : "btn-ghost"}
            onClick={() => setKind("recurring")}
          >
            Ricorrente settimanale
          </button>
          <button
            type="button"
            className={kind === "event" ? "btn-primary" : "btn-ghost"}
            onClick={() => setKind("event")}
          >
            Extra / evento
          </button>
        </div>
        <input type="hidden" name="kind" value={kind} />
      </div>

      <div>
        <label className="label">Titolo</label>
        <input
          name="title"
          className="input"
          defaultValue={kind === "event" ? "Evento speciale" : "Allenamento"}
        />
      </div>

      {kind === "recurring" ? (
        <div>
          <label className="label">Giorno della settimana</label>
          <select name="weekday" className="input" defaultValue="1">
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="label">Data evento</label>
          <input name="event_date" type="date" required className="input" />
        </div>
      )}

      <div>
        <label className="label">Ora inizio</label>
        <input name="start_time" type="time" required className="input" />
      </div>
      <div>
        <label className="label">Ora fine</label>
        <input name="end_time" type="time" required className="input" />
      </div>

      <div>
        <label className="label">Destinatari</label>
        <select name="audience" className="input" defaultValue="misto">
          <option value="misto">Misto</option>
          <option value="agonisti">Agonisti</option>
          <option value="amatori">Amatori</option>
        </select>
      </div>
      <div>
        <label className="label">Posti minimi</label>
        <input name="min_capacity" type="number" min={0} defaultValue={2} className="input" />
      </div>
      <div>
        <label className="label">Posti massimi</label>
        <input name="max_capacity" type="number" min={1} defaultValue={12} className="input" />
      </div>
      <div>
        <label className="label">Note (opzionale)</label>
        <input name="notes" className="input" />
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        <button className="btn-primary">Crea slot</button>
      </div>
    </form>
  );
}
