import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { bookSlot, cancelBooking } from "@/lib/actions/bookings";
import {
  datesBetween,
  formatDateIT,
  formatTime,
  monthBounds,
  shiftMonth,
  slotsForDate,
  toISODate,
} from "@/lib/dates";
import { AUDIENCE_LABEL, type TrainingSlot } from "@/lib/types";
import ErrorBanner from "@/components/error-banner";
import { getCalendarDaysAhead, getCurrentSeason } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CalendarioPage(
  props: {
    searchParams: Promise<{ error?: string; month?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  const DAYS_AHEAD = await getCalendarDaysAhead(supabase);
  const season = await getCurrentSeason(supabase);

  const today = toISODate(new Date());
  // La finestra "giorni visibilità" decorre da oggi, oppure dall'inizio
  // stagione se la stagione non è ancora iniziata (altrimenti gli slot
  // ricorrenti del primo mese di stagione risulterebbero sempre nascosti
  // quando "oggi" precede di molto l'avvio della stagione).
  const windowStart = season && today < season.start_date ? season.start_date : today;
  const cutoffDate = toISODate(
    new Date(new Date(windowStart + "T00:00:00").getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000)
  );

  const todayMonth = today.slice(0, 7);
  const seasonStartMonth = season ? season.start_date.slice(0, 7) : todayMonth;
  const seasonEndMonth = season ? season.end_date.slice(0, 7) : todayMonth;
  const minMonth = todayMonth > seasonStartMonth ? todayMonth : seasonStartMonth;

  let month = searchParams.month || minMonth;
  if (month < minMonth) month = minMonth;
  if (season && month > seasonEndMonth) month = seasonEndMonth;

  const { first: monthFirst, last: monthLast } = monthBounds(month);
  let rangeFrom = monthFirst < today ? today : monthFirst;
  let rangeTo = monthLast;
  if (season) {
    if (rangeFrom < season.start_date) rangeFrom = season.start_date;
    if (rangeTo > season.end_date) rangeTo = season.end_date;
  }

  const dates = rangeFrom <= rangeTo ? datesBetween(rangeFrom, rangeTo) : [];

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const canGoPrev = prevMonth >= minMonth;
  const canGoNext = !season || nextMonth <= seasonEndMonth;

  const monthLabel = new Date(month + "-01T00:00:00").toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const [{ data: slots }, { data: occupancy }, { data: myBookings }, { data: closures }] =
    dates.length > 0
      ? await Promise.all([
          supabase.from("training_slots").select("*").eq("is_active", true),
          supabase.rpc("slot_occupancy", { p_from: rangeFrom, p_to: rangeTo }),
          supabase
            .from("bookings")
            .select("id, slot_id, session_date")
            .eq("user_id", user.id)
            .eq("status", "active")
            .gte("session_date", rangeFrom)
            .lte("session_date", rangeTo),
          supabase
            .from("club_closures")
            .select("start_date, end_date, reason")
            .lte("start_date", rangeTo)
            .gte("end_date", rangeFrom),
        ])
      : [{ data: null }, { data: null }, { data: null }, { data: null }];

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

  const canView = (slot: TrainingSlot) =>
    profile.role === "admin" ||
    slot.audience === "misto" ||
    (slot.audience === "agonisti" && profile.role === "agonista") ||
    (slot.audience === "amatori" && profile.role === "amatore");

  const canJoin = canView;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Calendario allenamenti</h1>
      <p className="mb-4 text-sm text-slate-600">
        Slot ricorrenti visibili fino a {DAYS_AHEAD} giorni da oggi (gli eventi extra
        futuri sono sempre visibili){season ? ` · stagione ${season.name}` : ""} · il
        tuo limite: {profile.weekly_limit} prenotazion
        {profile.weekly_limit === 1 ? "e" : "i"} a settimana
      </p>
      <ErrorBanner message={searchParams.error} />

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={canGoPrev ? `/calendario?month=${prevMonth}` : "#"}
          className={`btn-ghost ${!canGoPrev ? "pointer-events-none opacity-40" : ""}`}
        >
          ← Mese precedente
        </Link>
        <h2 className="text-lg font-semibold capitalize text-navy-800">{monthLabel}</h2>
        <Link
          href={canGoNext ? `/calendario?month=${nextMonth}` : "#"}
          className={`btn-ghost ${!canGoNext ? "pointer-events-none opacity-40" : ""}`}
        >
          Mese successivo →
        </Link>
      </div>

      {dates.length === 0 && (
        <div className="card text-sm text-slate-600">
          {season
            ? `Nessuna data disponibile in questo mese per la stagione ${season.name}.`
            : "Nessuna stagione corrente configurata: contatta l'amministratore."}
        </div>
      )}

      <div className="space-y-6">
        {dates.map((date) => {
          const daySlots = slotsForDate(slots ?? [], date, cutoffDate);
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
                {daySlots.filter(canView).map((slot) => {
                  const count = booked.get(`${slot.id}|${date}`) ?? 0;
                  const myBookingId = mine.get(`${slot.id}|${date}`);
                  const full = count >= slot.max_capacity;
                  const minReached = count >= slot.min_capacity;
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
                          {slot.event_date && slot.notes && (
                            <p className="mt-1 text-xs text-slate-500">{slot.notes}</p>
                          )}
                          {slot.event_date && slot.sede_evento && (
                            <p className="mt-1 text-xs text-slate-600">📍 {slot.sede_evento}</p>
                          )}
                          {slot.event_date && slot.url && (
                            <p className="mt-1 text-xs">
                              <a href={slot.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Link evento
                              </a>
                            </p>
                          )}
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
                        {minReached && (
                          <span className="ml-2 text-sm text-green-600">✓ Confermato</span>
                        )}
                        {!minReached && (
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
                              {full ? "Completo" : slot.event_date ? "Partecipa" : "Prenota"}
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
