import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { bookSlot, cancelBooking } from "@/lib/actions/bookings";
import { formatDateIT, formatTime, slotsForDate, upcomingDates } from "@/lib/dates";
import { AUDIENCE_LABEL, type TrainingSlot } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";
import { getCalendarDaysAhead } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  const DAYS_AHEAD = await getCalendarDaysAhead(supabase);
  const dates = upcomingDates(DAYS_AHEAD);
  const from = dates[0];
  const to = dates[dates.length - 1];

  const [{ data: slots }, { data: occupancy }, { data: myBookings }, { data: closures }] =
    await Promise.all([
      supabase.from("training_slots").select("*").eq("is_active", true),
      supabase.rpc("slot_occupancy", { p_from: from, p_to: to }),
      supabase
        .from("bookings")
        .select("id, slot_id, session_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("session_date", from)
        .lte("session_date", to),
      supabase
        .from("club_closures")
        .select("start_date, end_date, reason")
        .lte("start_date", to)
        .gte("end_date", from),
    ]);

  const closureFor = (date: string) =>
    (closures ?? []).find((c) => date >= c.start_date && date <= c.end_date);

  const booked = new Map<string, number>();
  for (const o of occupancy ?? []) {
    booked.set(`${o.slot_id}|${o.session_date}`, o.booked);
  }
  const mine = new Map<string, string>(); // slot|date -> booking id
  for (const b of myBookings ?? []) {
    mine.set(`${b.slot_id}|${b.session_date}`, b.id);
  }

  const canJoin = (slot: TrainingSlot) =>
    profile.role === "admin" ||
    slot.audience === "misto" ||
    (slot.audience === "agonisti" && profile.role === "agonista") ||
    (slot.audience === "amatori" && profile.role === "amatore");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Calendario allenamenti</h1>
      <p className="mb-4 text-sm text-slate-600">
        Prossimi {DAYS_AHEAD} giorni · il tuo limite: {profile.weekly_limit}{" "}
        prenotazion{profile.weekly_limit === 1 ? "e" : "i"} a settimana
      </p>
      <ErrorBanner message={searchParams.error} />

      <div className="space-y-6">
        {dates.map((date) => {
          const daySlots = slotsForDate(slots ?? [], date);
          if (daySlots.length === 0) return null;
          const closure = closureFor(date);
          if (closure) {
            return (
              <section key={date}>
                <h2 className="mb-2 font-semibold capitalize text-slate-700">
                  {formatDateIT(date)}
                </h2>
                <div className="card border-crimson-100 bg-crimson-50 text-sm text-crimson-800">
                  🔒 Centro chiuso — {closure.reason}
                </div>
              </section>
            );
          }
          return (
            <section key={date}>
              <h2 className="mb-2 font-semibold capitalize text-slate-700">
                {formatDateIT(date)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daySlots.map((slot) => {
                  const count = booked.get(`${slot.id}|${date}`) ?? 0;
                  const myBookingId = mine.get(`${slot.id}|${date}`);
                  const full = count >= slot.max_capacity;
                  return (
                    <div key={slot.id} className="card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            {slot.title}
                            {slot.event_date && (
                              <span className="badge ml-2 bg-purple-100 text-purple-800">
                                Evento
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-600">
                            {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                          </p>
                        </div>
                        <span
                          className={`badge ${
                            slot.audience === "agonisti"
                              ? "bg-blue-100 text-blue-800"
                              : slot.audience === "amatori"
                                ? "bg-navy-100 text-navy-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {AUDIENCE_LABEL[slot.audience]}
                        </span>
                      </div>

                      <p className="mt-2 text-sm">
                        <span className={full ? "font-semibold text-red-600" : ""}>
                          {count}/{slot.max_capacity} posti occupati
                        </span>
                        {count < slot.min_capacity && (
                          <span className="ml-2 text-xs text-amber-600">
                            (minimo {slot.min_capacity} per confermare)
                          </span>
                        )}
                      </p>

                      <div className="mt-3">
                        {myBookingId ? (
                          <form action={cancelBooking}>
                            <input type="hidden" name="booking_id" value={myBookingId} />
                            <input type="hidden" name="from" value="/calendario" />
                            <button className="btn-danger w-full">
                              Cancella prenotazione
                            </button>
                          </form>
                        ) : canJoin(slot) ? (
                          <form action={bookSlot}>
                            <input type="hidden" name="slot_id" value={slot.id} />
                            <input type="hidden" name="session_date" value={date} />
                            <button className="btn-navy w-full" disabled={full}>
                              {full ? "Completo" : "Prenota"}
                            </button>
                          </form>
                        ) : (
                          <p className="text-center text-xs text-slate-400">
                            Riservato: {AUDIENCE_LABEL[slot.audience]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
