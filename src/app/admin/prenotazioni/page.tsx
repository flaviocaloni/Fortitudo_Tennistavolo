import { createClient } from "@/lib/supabase/server";
import ErrorBanner from "@/components/error-banner";
import BookingsTableClient from "@/components/bookings-table-client";

export const dynamic = "force-dynamic";

export default async function AdminPrenotazioniPage(
  props: {
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  let bookings: any[] = [];
  let errorMsg: string | null = null;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, session_date, status, profiles:user_id(full_name, role), training_slots(title, start_time, end_time)"
      )
      .eq("status", "active")
      .order("session_date", { ascending: false });

    if (error) {
      errorMsg = error.message || "Errore nel caricamento prenotazioni";
    } else {
      bookings = data ?? [];
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Errore sconosciuto";
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tutte le prenotazioni attive</h1>
      <ErrorBanner message={searchParams.error} />

      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <b>Errore:</b> {errorMsg}
        </div>
      )}

      <BookingsTableClient bookings={bookings} />
    </div>
  );
}
