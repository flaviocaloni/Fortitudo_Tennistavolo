"use client";

import { useState } from "react";
import { WEEKDAYS, type Season, type TrainingSlot } from "@/lib/types";

export default function SlotForm({
  action,
  seasons,
  currentSeasonId,
  slot,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  seasons: Season[];
  currentSeasonId?: string;
  slot?: TrainingSlot;
  submitLabel?: string;
}) {
  const [kind, setKind] = useState<"recurring" | "event">(
    slot?.event_date ? "event" : "recurring"
  );

  return (
    <form action={action} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {slot && <input type="hidden" name="slot_id" value={slot.id} />}

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
          defaultValue={slot?.title ?? (kind === "event" ? "Evento speciale" : "Allenamento")}
        />
      </div>

      {kind === "recurring" ? (
        <>
          <div>
            <label className="label">Giorno della settimana</label>
            <select name="weekday" className="input" defaultValue={slot?.weekday ?? 1}>
              {WEEKDAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Data inizio</label>
            <input
              name="start_date"
              type="date"
              defaultValue={slot?.start_date ?? ""}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Data fine</label>
            <input
              name="end_date"
              type="date"
              defaultValue={slot?.end_date ?? ""}
              required
              className="input"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="label">Data evento</label>
            <input
              name="event_date"
              type="date"
              defaultValue={slot?.event_date ?? ""}
              required
              className="input"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="label">Sede evento (opzionale)</label>
            <input name="sede_evento" defaultValue={slot?.sede_evento ?? ""} className="input" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="label">URL (opzionale)</label>
            <input name="url" defaultValue={slot?.url ?? ""} className="input" />
          </div>
        </>
      )}

      <div>
        <label className="label">Ora inizio</label>
        <input
          name="start_time"
          type="time"
          defaultValue={slot?.start_time?.slice(0, 5) ?? ""}
          required
          className="input"
        />
      </div>
      <div>
        <label className="label">Ora fine</label>
        <input
          name="end_time"
          type="time"
          defaultValue={slot?.end_time?.slice(0, 5) ?? ""}
          required
          className="input"
        />
      </div>

      <div>
        <label className="label">Destinatari</label>
        <select name="audience" className="input" defaultValue={slot?.audience ?? "misto"}>
          <option value="misto">Misto</option>
          <option value="agonisti">Agonisti</option>
          <option value="amatori">Amatori</option>
        </select>
      </div>
      <div>
        <label className="label">Posti minimi</label>
        <input
          name="min_capacity"
          type="number"
          min={0}
          defaultValue={slot?.min_capacity ?? 2}
          className="input"
        />
      </div>
      <div>
        <label className="label">Posti massimi</label>
        <input
          name="max_capacity"
          type="number"
          min={1}
          defaultValue={slot?.max_capacity ?? 12}
          className="input"
        />
      </div>
      <div>
        <label className="label">Note (opzionale)</label>
        <input name="notes" defaultValue={slot?.notes ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Stagione</label>
        <select name="season_id" className="input" defaultValue={slot?.season_id ?? currentSeasonId}>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.is_current ? " (corrente)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        <button className="btn-primary">{submitLabel ?? "Crea slot"}</button>
      </div>
    </form>
  );
}
