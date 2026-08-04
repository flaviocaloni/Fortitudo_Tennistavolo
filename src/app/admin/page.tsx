import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = toISODate(new Date());

  const [slots, users, activeFuture, history, allProfiles] = await Promise.all([
    supabase.from("training_slots").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("session_date", today),
    // niente join: booking_history non ha FK verso profiles
    supabase
      .from("booking_history")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(15),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const nameById = new Map<string, string>(
    (allProfiles.data ?? []).map((p) => [p.id, p.full_name])
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-700">{slots.count ?? 0}</p>
          <p className="text-sm text-slate-600">Slot attivi</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-700">{users.count ?? 0}</p>
          <p className="text-sm text-slate-600">Utenti registrati</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-700">{activeFuture.count ?? 0}</p>
          <p className="text-sm text-slate-600">Prenotazioni future</p>
        </div>
      </div>

      <h2 className="mb-2 font-semibold text-slate-700">Ultime attività (log)</h2>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Quando</th>
              <th className="px-3 py-2">Utente</th>
              <th className="px-3 py-2">Azione</th>
              <th className="px-3 py-2">Data sessione</th>
            </tr>
          </thead>
          <tbody>
            {(history.data ?? []).map((h) => (
              <tr key={h.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">
                  {new Date(h.occurred_at).toLocaleString("it-IT")}
                </td>
                <td className="px-3 py-2">{nameById.get(h.user_id) ?? "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`badge ${
                      h.action === "created"
                        ? "bg-navy-100 text-navy-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {h.action === "created"
                      ? "Prenotazione"
                      : h.action === "cancelled"
                        ? "Cancellazione"
                        : h.action === "admin_cancelled"
                          ? "Cancellata da admin"
                          : "Modificata da admin"}
                  </span>
                </td>
                <td className="px-3 py-2">{h.session_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
