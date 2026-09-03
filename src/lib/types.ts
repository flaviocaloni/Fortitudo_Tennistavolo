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
  is_active: boolean;
  fitet_card_number: string | null;
  squadra: string | null;
  girone: string | null;
  serie: string | null;
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
  season_id: string;
  start_date: string | null;
  end_date: string | null;
  sede_evento: string | null;
  url: string | null;
}

export interface Booking {
  id: string;
  slot_id: string;
  user_id: string;
  session_date: string;
  status: BookingStatus;
  created_at: string;
  cancelled_at: string | null;
  season_id: string | null;
  is_overbooking: boolean;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
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

export type NotificationCode = "EVENT_NON_RECURRING_BOOKING";
export type RecipientMode = "ALL_ADMINS" | "ALL_USERS" | "MANUAL";
export type DeliveryStatus = "pending" | "sent" | "failed";

export interface NotificationConfig {
  id: number;
  notification_code: NotificationCode;
  is_active: boolean;
  delivery_channel: string;
  recipient_mode: RecipientMode;
  manual_recipient_ids: string[] | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface NotificationDelivery {
  id: number;
  notification_config_id: number;
  booking_id: string;
  recipient_user_id: string;
  recipient_email: string;
  status: DeliveryStatus;
  error_code: string | null;
  error_message: string | null;
  provider_response: string | null;
  delivery_idempotency_key: string;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationAudit {
  id: number;
  notification_config_id: number;
  change_type: "created" | "updated" | "activated" | "deactivated";
  modified_by: string;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  modified_at: string;
}
