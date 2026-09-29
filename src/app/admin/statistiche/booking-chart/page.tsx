import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { getCurrentSeason } from "@/lib/settings";
import type { Booking, Season } from "@/lib/types";
import AdminBookingsChart from "@/components/admin-bookings-chart";
import SeasonFilter from "@/components/season-filter";

export const dynamic = "force-dynamic";

export default async function BookingChartStatistichePage(props: {
  searchParams: Promise<{ season?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const admin = createAdminClient();
  const dbClient = admin || supabase;

  // Recupera stagioni
  const { data: seasons } = await dbClient
    .from("seasons")
    .select("*")
    .order("start_date", { ascending: false });
  const currentSeason = await getCurrentSeason(dbClient);
  const selectedSeasonId = searchParams.season || currentSeason?.id || "all";

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const minDate = twoYearsAgo.toISOString().split("T")[0];

  // Recupera booking
  let query = dbClient
    .from("bookings")
    .select("id, slot_id, user_id, session_date, status, created_at, cancelled_at, season_id, is_overbooking")
    .gte("session_date", minDate)
    .order("session_date", { ascending: false });

  if (selectedSeasonId !== "all") {
    query = query.eq("season_id", selectedSeasonId);
  }

  const { data: bookings } = await query;
  const allBookings = (bookings ?? []) as Booking[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Grafico Prenotazioni</h1>
        <p className="text-gray-600 mt-1">Trend e analisi delle prenotazioni nel tempo</p>
      </div>

      <div className="mb-6">
        <SeasonFilter
          seasons={(seasons ?? []) as Season[]}
          selectedSeasonId={selectedSeasonId}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {allBookings.length > 0 ? (
          <AdminBookingsChart bookings={allBookings} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Nessun dato di prenotazione disponibile per il periodo selezionato.</p>
          </div>
        )}
      </div>
    </div>
  );
}
