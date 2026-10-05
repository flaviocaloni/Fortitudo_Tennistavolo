import { createClient } from "@/lib/supabase/server";
import {
  deleteSlot,
  toggleSlotActive,
  updateSlot,
} from "@/lib/actions/admin";
import { formatTime } from "@/lib/dates";
import { AUDIENCE_LABEL, type TrainingSlot } from "@/lib/types";
import SlotEditToggle from "@/components/admin/slot-edit-toggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PizzaSlotPage() {
  const supabase = await createClient();
  const [{ data: slots }, { data: seasons }] = await Promise.all([
    supabase
      .from("training_slots")
      .select("*")
      .not("pizza_date", "is", null)
      .order("pizza_date")
      .order("start_time"),
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
  ]);

  const slots_data = (slots ?? []) as TrainingSlot[];
  const seasonNameById = new Map((seasons ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">🍕 Slot Pizza</h1>
      <p className="mb-6 text-slate-600">
        Gestisci gli eventi pizza con selezione del numero di partecipanti.
      </p>

      {slots_data.length === 0 && (
        <p className="text-sm text-slate-500">Nessuno slot pizza.</p>
      )}

      <div className="space-y-2">
        {slots_data.map((s: TrainingSlot) => (
          <div
            key={s.id}
            className={`card ${s.is_active ? "" : "opacity-60"}`}
          >
            <div className="mb-3">
              <p className="font-medium">
                🍕 {s.title} · {s.pizza_date ? new Date(s.pizza_date + "T00:00:00").toLocaleDateString("it-IT") : "—"} · {formatTime(s.start_time)}–{formatTime(s.end_time)}
              </p>
              <p className="text-sm text-slate-600">
                N. partecipanti: {s.max_participants ?? "—"} · Destinatari: {AUDIENCE_LABEL[s.audience]} · Posti: min {s.min_capacity} – max {s.max_capacity} · Stagione: {seasonNameById.get(s.season_id) ?? "—"} · Stato: {s.is_active ? "Attivo" : "DISATTIVATO"}
              </p>
              {s.notes && <p className="text-sm text-slate-600">Note: {s.notes}</p>}
              <p className="text-xs text-slate-400">ID: {s.id}</p>
            </div>
            <div className="flex gap-2">
              <SlotEditToggle slot={s} action={updateSlot} seasons={seasons ?? []} />
              <Link href={`/admin/slot/pizza/${s.id}/clone`} className="btn-ghost">
                🔄 Clona
              </Link>
              <form action={toggleSlotActive}>
                <input type="hidden" name="slot_id" value={s.id} />
                <input type="hidden" name="is_active" value={String(!s.is_active)} />
                <button className="btn-ghost">
                  {s.is_active ? "Disattiva" : "Riattiva"}
                </button>
              </form>
              <form action={deleteSlot}>
                <input type="hidden" name="slot_id" value={s.id} />
                <button className="btn-danger">Elimina</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
