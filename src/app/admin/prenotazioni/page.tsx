import { createClient } from "@/lib/supabase/server";
import { adminCancelBooking } from "@/lib/actions/admin";
import { formatDateIT, formatTime, toISODate } from "@/lib/dates";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function AdminPrenotazioniPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const today = toISODate(new Date());

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, profiles:user_id(full_name, role), training_slots(title, start_time, end_time)"
    )
    .eq("status", "active")
    .gte("session_date", today)
    .order("session_date")
    .order("created_at");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tutte le prenotazioni attive</h1>
      <ErrorBanner message={searchParams.error} />

      {(bookings ?? []).length === 0 && (
        <p className="text-sm text-slate-500">Nessuna prenotazione futura.</p>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Slot</th>
              <th className="px-3 py-2">Utente</th>
              <th className="px-3 py-2">Ruolo</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-3 py-2 capitalize">{formatDateIT(b.session_date)}</td>
                <td className="px-3 py-2">
                  {b.training_slots?.title} ({formatTime(b.training_slots?.start_time ?? "")}–
                  {formatTime(b.training_slots?.end_time ?? "")})
                </td>
                <td className="px-3 py-2 font-medium">{b.profiles?.full_name}</td>
                <td className="px-3 py-2">{b.profiles?.role}</td>
                <td className="px-3 py-2 text-right">
                  <form action={adminCancelBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button className="btn-danger">Cancella</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
