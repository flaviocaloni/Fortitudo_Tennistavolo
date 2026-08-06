export type UserRole = "admin" | "agonista" | "amatore";
export type SlotAudience = "agonisti" | "amatori" | "misto";
export type BookingStatus = "active" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  weekly_limit: number;
  created_at: string;
  medical_certificate_expiry: string | null;
}

export interface TrainingSlot {
  id: string;
  weekday: number | null; // 0=domenica … 6=sabato; null per slot evento
  event_date: string | null; // valorizzato solo per slot extra/evento
  title: string;
  start_time: string;
  end_time: string;
  audience: SlotAudience;
  min_capacity: number;
  max_capacity: number;
  is_active: boolean;
  notes: string | null;
}

export interface Booking {
  id: string;
  slot_id: string;
  user_id: string;
  session_date: string;
  status: BookingStatus;
  created_at: string;
  cancelled_at: string | null;
}

export const WEEKDAYS = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
] as const;

export const AUDIENCE_LABEL: Record<SlotAudience, string> = {
  agonisti: "Agonisti",
  amatori: "Amatori",
  misto: "Misto",
};
