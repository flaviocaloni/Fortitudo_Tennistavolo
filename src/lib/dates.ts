import type { TrainingSlot } from "./types";

/** Data in formato YYYY-MM-DD (fuso locale). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateIT(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "HH:MM:SS" -> "HH:MM" */
export function formatTime(t: string): string {
  return t.slice(0, 5);
}

/** Prossimi `days` giorni a partire da oggi (incluso). */
export function upcomingDates(days: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < days; i++) {
    out.push(toISODate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Slot che si svolgono in una certa data (ricorrenti per weekday + eventi).
 *  `recurringCutoff` (opzionale) limita la visibilità/prenotabilità dei soli
 *  slot ricorrenti (finestra "giorni visibilità calendario"): gli eventi
 *  extra restano sempre visibili se futuri, indipendentemente dal cutoff. */
export function slotsForDate(
  slots: TrainingSlot[],
  isoDate: string,
  recurringCutoff?: string
): TrainingSlot[] {
  const dow = new Date(isoDate + "T00:00:00").getDay();
  return slots
    .filter((s) => {
      if (s.event_date) return s.event_date === isoDate;
      if (s.weekday !== dow) return false;
      return !recurringCutoff || isoDate <= recurringCutoff;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/** Primo e ultimo giorno (YYYY-MM-DD) del mese "YYYY-MM". */
export function monthBounds(monthStr: string): { first: string; last: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const first = `${monthStr}-01`;
  const last = toISODate(new Date(y, m, 0));
  return { first, last };
}

/** Mese (YYYY-MM) spostato di `delta` mesi rispetto a `monthStr`. */
export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Tutte le date (YYYY-MM-DD) comprese tra `from` e `to`, inclusi. */
export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  if (from > to) return out;
  const d = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (d <= end) {
    out.push(toISODate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Lunedì della settimana ISO della data. */
export function startOfISOWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}
