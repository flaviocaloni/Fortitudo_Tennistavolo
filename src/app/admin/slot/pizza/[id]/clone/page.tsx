import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { getCurrentSeason } from "@/lib/settings";
import { type TrainingSlot } from "@/lib/types";
import { isAdmin } from "@/lib/utils/roles";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

async function cloneSlot(formData: FormData) {
  "use server";
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const seasonId = String(formData.get("season_id") ?? "");
  if (!seasonId) {
    const pizzaId = String(formData.get("pizza_id") ?? "");
    redirect(`/admin/slot/pizza/${pizzaId}/clone?error=${encodeURIComponent("Seleziona una stagione")}`);
  }

  const payload = {
    slot_type: "PIZZA",
    title: String(formData.get("title") || "Pizza"),
    weekday: null,
    event_date: null,
    pizza_date: String(formData.get("pizza_date") ?? ""),
    start_date: null,
    end_date: null,
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
    audience: String(formData.get("audience") ?? "misto"),
    min_capacity: Number(formData.get("min_capacity") ?? 1),
    max_capacity: Number(formData.get("max_capacity") ?? 99),
    max_participants: Number(formData.get("max_participants") ?? 1),
    notes: String(formData.get("notes") ?? "") || null,
    season_id: seasonId,
  };

  const { error } = await supabase.from("training_slots").insert(payload);
  if (error) {
    const pizzaId = String(formData.get("pizza_id") ?? "");
    redirect(`/admin/slot/pizza/${pizzaId}/clone?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/slot/pizza");
  redirect("/admin/slot/pizza");
}

export default async function ClonePizzaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: pizza }, { data: seasons }, currentSeason] = await Promise.all([
    supabase.from("training_slots").select("*").eq("id", id).single(),
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
    getCurrentSeason(supabase),
  ]);

  if (!pizza) {
    redirect("/admin/slot/pizza");
  }

  const slot = pizza as TrainingSlot;

  return (
    <div className="max-w-2xl">
      <a href="/admin/slot/pizza" className="text-sm text-blue-600 hover:underline mb-4 block">
        ← Torna agli slot pizza
      </a>
      <h1 className="mb-2 text-2xl font-bold">Clona slot pizza</h1>
      <p className="mb-6 text-slate-600">
        Stai clonando: <strong>🍕 {slot.title}</strong> del{" "}
        {new Date(slot.pizza_date! + "T00:00:00").toLocaleDateString("it-IT")}
      </p>

      <ErrorBanner message={sp.error} />

      <form action={cloneSlot} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="pizza_id" value={id} />
        <input type="hidden" name="kind" value="pizza" />

        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Titolo</label>
          <input
            name="title"
            className="input"
            defaultValue={`${slot.title} (copia)`}
            required
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Data pizza</label>
          <input
            name="pizza_date"
            type="date"
            defaultValue={slot.pizza_date ?? ""}
            required
            className="input"
          />
        </div>

        <div>
          <label className="label">N. partecipanti</label>
          <select name="max_participants" className="input" defaultValue={slot.max_participants ?? 1}>
            <option value={1}>1 persona</option>
            <option value={2}>2 persone</option>
            <option value={3}>3 persone</option>
            <option value={4}>4 persone</option>
            <option value={5}>5 persone</option>
          </select>
        </div>

        <div>
          <label className="label">Ora inizio</label>
          <input
            name="start_time"
            type="time"
            defaultValue={slot.start_time?.slice(0, 5) ?? ""}
            required
            className="input"
          />
        </div>

        <div>
          <label className="label">Ora fine</label>
          <input
            name="end_time"
            type="time"
            defaultValue={slot.end_time?.slice(0, 5) ?? ""}
            required
            className="input"
          />
        </div>

        <div>
          <label className="label">Destinatari</label>
          <select name="audience" className="input" defaultValue={slot.audience ?? "misto"}>
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
            defaultValue={slot.min_capacity ?? 2}
            className="input"
          />
        </div>

        <div>
          <label className="label">Posti massimi</label>
          <input
            name="max_capacity"
            type="number"
            min={1}
            defaultValue={slot.max_capacity ?? 99}
            className="input"
          />
        </div>

        <div>
          <label className="label">Note (opzionale)</label>
          <input name="notes" defaultValue={slot.notes ?? ""} className="input" />
        </div>

        <div>
          <label className="label">Stagione</label>
          <select name="season_id" className="input" defaultValue={slot.season_id ?? currentSeason?.id}>
            {(seasons ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.is_current ? " (corrente)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn-primary">Crea slot clonato</button>
        </div>
      </form>
    </div>
  );
}
