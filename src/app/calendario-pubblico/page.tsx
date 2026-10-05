import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { bookSlot, cancelBooking } from "@/lib/actions/bookings";
import { isAdmin } from "@/lib/utils/roles";
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
import { getChampionshipMatchesAll, type ChampionshipMatch, type GroupedMatches } from "@/lib/supabase/championship-calendar";
import { createClient } from "@/lib/supabase/server";
import ErrorBanner from "@/components/error-banner";
import SlotParticipantsModal from "@/components/slot-participants-modal";
import { getCalendarDaysAhead, getCurrentSeason } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CalendarioPubblicPage(
  props: {
    searchParams: Promise<{ error?: string; month?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();

  const supabasePublic = await createClient();
  const season = await getCurrentSeason(supabasePublic);
  const DAYS_AHEAD = await getCalendarDaysAhead(supabasePublic);

  const today = toISODate(new Date());
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

  // Build queries - all public, no auth requirements
  const queries = [];

  // Training slots - NO audience filter
  if (season) {
    queries.push(
      supabasePublic
        .from("training_slots")
        .select("*")
        .eq("is_active", true)
        .eq("season_id", season.id)
    );
  } else {
    queries.push(supabasePublic.from("training_slots").select("*").eq("is_active", true));
  }

  // Occupancy
  queries.push(supabasePublic.rpc("slot_occupancy", { p_from: rangeFrom, p_to: rangeTo }));

  // My bookings - only if authenticated
  if (user && profile) {
    queries.push(
      supabasePublic
        .from("bookings")
        .select("id, slot_id, session_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("session_date", rangeFrom)
        .lte("session_date", rangeTo)
    );
  } else {
    queries.push(Promise.resolve({ data: null }));
  }

  // Closures
  queries.push(
    supabasePublic
      .from("club_closures")
      .select("start_date, end_date, reason")
      .lte("start_date", rangeTo)
      .gte("end_date", rangeFrom)
  );

  // Championship matches - ALL (no team filter)
  queries.push(getChampionshipMatchesAll(supabasePublic, rangeFrom, rangeTo));

  const results =
    dates.length > 0
      ? await Promise.all(queries)
      : [{ data: null }, { data: null }, { data: null }, { data: null }, {}];

  const [{ data: slots }, { data: occupancy }, { data: myBookings }, { data: closures }, championshipMatches] = results as any;

  const closureFor = (date: string) =>
    (closures ?? []).find((c: any) => date >= c.start_date && date <= c.end_date);

  const booked = new Map<string, number>();
  for (const o of occupancy ?? []) {
    booked.set(`${o.slot_id}|${o.session_date}`, o.booked);
  }

  const mine = new Map<string, string>();
  for (const b of myBookings ?? []) {
    mine.set(`${b.slot_id}|${b.session_date}`, b.id);
  }

  // Logica di visibilità:
  // canView: mostra il slot (sempre vero, ma mostra audience badge)
  const canView = (slot: TrainingSlot) => true;

  // canJoin: permette di prenotare solo se autenticato e audience match
  const canJoin = (slot: TrainingSlot) => {
    if (!user || !profile) return false; // Not authenticated
    if (isAdmin(profile.role)) return true;
    return (
      slot.audience === "misto" ||
      (slot.audience === "agonisti" && profile.role === "agonista") ||
      (slot.audience === "amatori" && profile.role === "amatore")
    );
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Calendario Pubblico</h1>
      <p className="mb-4 text-sm text-slate-600">
        Visualizzazione pubblica di allenamenti, eventi e partite di campionato
        {season ? ` · stagione ${season.name}` : ""}
      </p>
      <ErrorBanner message={searchParams.error} />

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={canGoPrev ? `/calendario-pubblico?month=${prevMonth}` : "#"}
          className={`btn-ghost ${!canGoPrev ? "pointer-events-none opacity-40" : ""}`}
        >
          ← Mese precedente
        </Link>
        <h2 className="text-lg font-semibold capitalize text-navy-800">{monthLabel}</h2>
        <Link
          href={canGoNext ? `/calendario-pubblico?month=${nextMonth}` : "#"}
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
          // Championship matches for this date - ALL
          const dayMatches: Array<GroupedMatches> = Object.values(championshipMatches).filter(
            (match) => (match as any).date === date
          ) as any;

          const daySlots = slotsForDate(slots ?? [], date, cutoffDate);
          const closure = closureFor(date);

          if (daySlots.length === 0 && dayMatches.length === 0) return null;

          return (
            <section key={date}>
              <h2 className="mb-2 font-semibold capitalize text-slate-700">
                {formatDateIT(date)}
              </h2>

              {closure ? (
                <div className="card border-crimson-100 bg-crimson-50 text-sm text-crimson-800">
                  🔒 Centro chiuso — {closure.reason}
                </div>
              ) : (
                <>
                  {/* Championship matches section - ALWAYS read-only */}
                  {dayMatches.length > 0 && (
                    <div className="mb-4 space-y-2 border-l-4 border-red-600 bg-red-50 p-4">
                      <h3 className="font-semibold text-red-900">🏐 CAMPIONATO</h3>
                      {dayMatches.map((timeGroup) => (
                        <div key={`${timeGroup.date}|${timeGroup.time}`} className="space-y-2">
                          {timeGroup.matches.map((match: ChampionshipMatch) => (
                            <div key={match.id} className="bg-white rounded-lg p-3 border border-red-200">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                                      {match.is_home ? "Casa" : "Trasferta"} · {match.location} · {formatTime(match.start_time)}
                                    </span>
                                  </p>
                                  <p className="mt-1 font-semibold text-gray-800">{match.team_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {match.series} | {match.round_name} vs {match.opponent}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Training slots section */}
                  {daySlots.length > 0 && (
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
                                <SlotParticipantsModal
                                  slotId={slot.id}
                                  sessionDate={date}
                                  maxCapacity={slot.max_capacity}
                                  occupiedSeats={count}
                                />
                                {" posti occupati"}
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
                              {myBookingId && user ? (
                                <form action={cancelBooking}>
                                  <input type="hidden" name="booking_id" value={myBookingId} />
                                  <input type="hidden" name="from" value="/calendario-pubblico" />
                                  <button className="btn-danger w-full">
                                    Cancella prenotazione
                                  </button>
                                </form>
                              ) : !user ? (
                                <Link href="/login" className="btn-navy w-full block text-center">
                                  Accedi per prenotare
                                </Link>
                              ) : canJoin(slot) ? (
                                <form action={bookSlot}>
                                  <input type="hidden" name="slot_id" value={slot.id} />
                                  <input type="hidden" name="session_date" value={date} />

                                  {slot.pizza_date && (
                                    <div className="mb-3">
                                      <label className="label text-xs">Numero partecipanti</label>
                                      <select name="selected_participants" className="input text-sm" defaultValue="1">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                          <option key={n} value={n}>
                                            {n === 1 ? "1 persona" : `${n} persone`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <button className="btn-navy w-full" disabled={full && !!slot.event_date}>
                                    {full && !!slot.event_date ? "Completo" : full && !slot.event_date ? "Prenota in overbooking" : !!slot.event_date ? "Partecipa" : "Prenota"}
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
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
