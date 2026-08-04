import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { cancelBooking } from "@/lib/actions/bookings";
import { formatDateIT, formatTime, toISODate } from "@/lib/dates";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function PrenotazioniPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { supabase, user } = await getSessionProfile();
  if (!user) redirect("/login");

  const today = toISODate(new Date());

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, training_slots(title, start_time, end_time)")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false });

  const active = (bookings ?? []).filter(
    (b) => b.status === "active" && b.session_date >= today
  );
  const past = (bookings ?? []).filter(
    (b) => b.status !== "active" || b.session_date < today
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Le mie prenotazioni</h1>
      <ErrorBanner message={searchParams.error} />

      <h2 className="mb-2 font-semibold text-slate-700">Prossime</h2>
      {active.length === 0 && (
        <p className="mb-4 text-sm text-slate-500">
          Nessuna prenotazione attiva.
        </p>
      )}
      <div className="mb-8 space-y-2">
        {active.map((b) => (
          <div key={b.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">
                {formatDateIT(b.session_date)} — {b.training_slots?.title}
              </p>
              <p className="text-sm text-slate-600">
                {formatTime(b.training_slots?.start_time ?? "")}–
                {formatTime(b.training_slots?.end_time ?? "")}
              </p>
            </div>
            <form action={cancelBooking}>
              <input type="hidden" name="booking_id" value={b.id} />
              <input type="hidden" name="from" value="/prenotazioni" />
              <button className="btn-danger">Cancella</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mb-2 font-semibold text-slate-700">Storico</h2>
      <div className="space-y-2">
        {past.map((b) => (
          <div
            key={b.id}
            className="card flex items-center justify-between opacity-70"
          >
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
                b.status === "cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {b.status === "cancelled" ? "Cancellata" : "Completata"}
            </span>
          </div>
        ))}
        {past.length === 0 && (
          <p className="text-sm text-slate-500">Nessuna prenotazione passata.</p>
        )}
      </div>
    </div>
  );
}
