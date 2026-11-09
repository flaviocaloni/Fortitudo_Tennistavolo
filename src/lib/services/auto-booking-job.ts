import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllUsersWithAutoBooking } from "@/lib/supabase/auto-booking";

export interface AutoBookingJobResult {
  users_processed: number;
  bookings_created: number;
  bookings_skipped: number;
  bookings_failed: number;
  errors: string[];
  message: string;
}

/**
 * Esegue l'auto-booking per tutti gli utenti abilitati, sulla finestra
 * oggi + 30 giorni. Usato dal cron Vercel e dal pulsante manuale in /sys.
 * Richiede un client con service role (le RLS nasconderebbero le righe).
 */
export async function runAutoBookingJob(supabase: SupabaseClient): Promise<AutoBookingJobResult> {
  const usersWithAutoBooking = await getAllUsersWithAutoBooking(supabase);
  const enabledUsers = usersWithAutoBooking.filter((u) => u.auto_booking_enabled);

  const result: AutoBookingJobResult = {
    users_processed: enabledUsers.length,
    bookings_created: 0,
    bookings_skipped: 0,
    bookings_failed: 0,
    errors: [],
    message: "Auto-booking completato",
  };

  if (enabledUsers.length === 0) {
    result.message = "Nessun utente con auto-booking abilitato";
    return result;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startDate = today.toISOString().split("T")[0];

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);
  const endDateStr = endDate.toISOString().split("T")[0];

  for (const user of enabledUsers) {
    try {
      const { data, error } = await supabase.rpc("auto_book_recurring_slots", {
        p_user_id: user.user_id,
        p_start_date: startDate,
        p_end_date: endDateStr,
      });

      if (error) {
        result.errors.push(`User ${user.user_id}: ${error.message}`);
      } else if (data) {
        result.bookings_created += data.bookings_created || 0;
        result.bookings_skipped += data.bookings_skipped || 0;
        result.bookings_failed += data.bookings_failed || 0;
        // La RPC restituisce solo l'ultimo errore SQL: lo riportiamo per capire la causa
        if ((data.bookings_failed || 0) > 0 && data.error_detail) {
          result.errors.push(`User ${user.user_id} (ultimo errore): ${data.error_detail}`);
        }
      }
    } catch (err) {
      result.errors.push(`User ${user.user_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
