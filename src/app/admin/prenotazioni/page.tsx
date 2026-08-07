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

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, session_date, status, profiles:user_id(full_name, role), training_slots(title, start_time, end_time)"
    )
    .eq("status", "active")
    .order("session_date", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tutte le prenotazioni attive</h1>
      <ErrorBanner message={searchParams.error} />

      <BookingsTableClient bookings={bookings ?? []} />
    </div>
  );
}
