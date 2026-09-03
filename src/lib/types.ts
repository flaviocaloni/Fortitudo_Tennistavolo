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

// ============ CAMPIONATO ============
export type ChampionshipSeries = "D3" | "D2" | "D1" | "C2" | "C1";
export type ChampionshipStatus = "draft" | "active" | "completed" | "archived";
export type LegType = "FIRST_LEG" | "RETURN_LEG" | "SINGLE";
export type VenueType = "HOME" | "AWAY";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
export type AttendanceStatus = "PRESENT" | "ABSENT";
export type AttendanceChangeSource = "DEFAULT_TEAM_ASSIGNMENT" | "PLAYER" | "ADMIN" | "SYSTEM";
export type PlayerStatus = "active" | "left" | "transferred";

export interface Championship {
  id: string;
  season_id: string;
  name: string;
  status: ChampionshipStatus;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
}

export interface ChampionshipTeam {
  id: string;
  championship_id: string;
  name: string;
  series: ChampionshipSeries;
  group_code: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
}

export interface ChampionshipTeamPlayer {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  status: PlayerStatus;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
}

export interface ChampionshipMatch {
  id: string;
  championship_id: string;
  season_id: string;
  team_id: string;
  opponent_name: string;
  opponent_club_name: string | null;
  leg_type: LegType;
  venue_type: VenueType;
  scheduled_start_at: string;
  timezone: string;
  venue_name: string | null;
  address: string | null;
  status: MatchStatus;
  notes: string | null;
  result: string | null;
  return_match_id: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
}

export interface ChampionshipMatchAttendance {
  id: string;
  match_id: string;
  user_id: string;
  status: AttendanceStatus;
  changed_by_user_id: string | null;
  changed_at: string;
  change_source: AttendanceChangeSource;
  created_at: string;
  updated_at: string;
}

export interface ChampionshipAttendanceHistory {
  id: string;
  attendance_id: string;
  match_id: string;
  user_id: string;
  previous_status: AttendanceStatus;
  new_status: AttendanceStatus;
  changed_by_user_id: string | null;
  change_source: AttendanceChangeSource;
  created_at: string;
}
