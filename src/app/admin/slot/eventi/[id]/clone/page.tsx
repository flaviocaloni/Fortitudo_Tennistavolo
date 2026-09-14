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
    const eventId = String(formData.get("event_id") ?? "");
    redirect(`/admin/slot/eventi/${eventId}/clone?error=${encodeURIComponent("Seleziona una stagione")}`);
  }

  const payload = {
    title: String(formData.get("title") || "Evento"),
    weekday: null,
    event_date: String(formData.get("event_date") ?? ""),
    start_date: null,
    end_date: null,
    start_time: String(formData.get("start_time")),
    end_time: String(formData.get("end_time")),
    audience: String(formData.get("audience") ?? "misto"),
    min_capacity: Number(formData.get("min_capacity") ?? 1),
    max_capacity: Number(formData.get("max_capacity") ?? 60),
    notes: String(formData.get("notes") ?? "") || null,
    season_id: seasonId,
    sede_evento: String(formData.get("sede_evento") ?? "") || null,
    url: String(formData.get("url") ?? "") || null,
  };

  const { error } = await supabase.from("training_slots").insert(payload);
  if (error) {
    const eventId = String(formData.get("event_id") ?? "");
    redirect(`/admin/slot/eventi/${eventId}/clone?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/slot/eventi");
  redirect("/admin/slot/eventi");
}

export default async function CloneEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: event }, { data: seasons }, currentSeason] = await Promise.all([
    supabase.from("training_slots").select("*").eq("id", id).single(),
    supabase.from("seasons").select("*").order("start_date", { ascending: false }),
    getCurrentSeason(supabase),
  ]);

  if (!event) {
    redirect("/admin/slot/eventi");
  }

  const slot = event as TrainingSlot;

  return (
    <div className="max-w-2xl">
      <a href="/admin/slot/eventi" className="text-sm text-blue-600 hover:underline mb-4 block">
        ← Torna agli eventi
      </a>
      <h1 className="mb-2 text-2xl font-bold">Clona evento</h1>
      <p className="mb-6 text-slate-600">
        Stai clonando: <strong>{slot.title}</strong> del{" "}
        {new Date(slot.event_date + "T00:00:00").toLocaleDateString("it-IT")}
      </p>

      <ErrorBanner message={sp.error} />

      <form action={cloneSlot} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="event_id" value={id} />
        <input type="hidden" name="kind" value="event" />

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
          <label className="label">Data evento</label>
          <input
            name="event_date"
            type="date"
            defaultValue={slot.event_date ?? ""}
            required
            className="input"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Sede evento (opzionale)</label>
          <input
            name="sede_evento"
            defaultValue={slot.sede_evento ?? ""}
            className="input"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">URL (opzionale)</label>
          <input name="url" defaultValue={slot.url ?? ""} className="input" />
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
            defaultValue={slot.max_capacity ?? 12}
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
