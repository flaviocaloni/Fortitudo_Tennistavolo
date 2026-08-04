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

/** Slot che si svolgono in una certa data (ricorrenti per weekday + eventi). */
export function slotsForDate(slots: TrainingSlot[], isoDate: string): TrainingSlot[] {
  const dow = new Date(isoDate + "T00:00:00").getDay();
  return slots
    .filter((s) =>
      s.event_date ? s.event_date === isoDate : s.weekday === dow
    )
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/** Lunedì della settimana ISO della data. */
export function startOfISOWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}
