import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSlot } from "@/lib/actions/admin";
import { getCurrentSeason, getCalendarVisibility } from "@/lib/settings";
import SlotForm from "@/components/admin/slot-form";

export const dynamic = "force-dynamic";

export default async function NewSlotPage() {
  const supabase = await createClient();
  const [{ data: seasons }, currentSeason, visibility] = await Promise.all([
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
    getCurrentSeason(supabase),
    getCalendarVisibility(supabase),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Nuovo slot</h1>
      <p className="mb-6 text-slate-600">
        Crea un nuovo allenamento ricorrente o un evento speciale.
      </p>

      <SlotForm action={createSlot} seasons={seasons ?? []} currentSeasonId={currentSeason?.id} />

      <div className="mt-8 border-t pt-8">
        <h2 className="mb-2 font-semibold text-slate-700">Visibilità calendario</h2>
        <p className="mb-4 text-sm text-slate-600">
          Configura quanti giorni in avanti gli utenti possono visualizzare e prenotare nel calendario.
        </p>

        <div className="card bg-slate-50">
          <p className="text-xs text-slate-600">
            Attualmente: {visibility.mode === "NEXT_WEEK_FROM_SATURDAY"
              ? <>la settimana successiva si apre il sabato precedente</>
              : <>gli utenti vedono slot fino a <strong>{visibility.days} giorni</strong> da oggi</>}.
            {" "}<Link href="/admin/slot/visibilita" className="text-navy-700 underline">Modifica</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
