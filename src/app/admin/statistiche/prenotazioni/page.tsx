import { redirect } from "next/navigation";
import Link from "next/link"; // Used for back navigation
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { getCurrentSeason } from "@/lib/settings";
import type { Booking, Profile, Season } from "@/lib/types";
import AdminUsersReport from "@/components/admin-users-report";
import SeasonFilter from "@/components/season-filter";

export const dynamic = "force-dynamic";

interface Periods {
  week: number;
  month: number;
  year: number;
  cancelled: number;
}

function countPeriods(bookings: Pick<Booking, "session_date" | "status">[]): Periods {
  const res: Periods = { week: 0, month: 0, year: 0, cancelled: 0 };
  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthPrefix = today.slice(0, 7);
  const yearPrefix = today.slice(0, 4);

  for (const b of bookings) {
    if (b.status === "cancelled") {
      if (b.session_date.startsWith(yearPrefix)) res.cancelled++;
      continue;
    }
    if (b.session_date.startsWith(yearPrefix)) res.year++;
    if (b.session_date.startsWith(monthPrefix)) res.month++;
    if (b.session_date >= weekStartStr) res.week++;
  }
  return res;
}

interface UserStats {
  profile: Profile;
  stats: Periods;
}

export default async function PrenotazioniStatistichePage(props: {
  searchParams: Promise<{ season?: string; search?: string }>;
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
  const allBookings = bookings ?? [];

  // Carica tutti i profili
  const { data: profiles } = await dbClient
    .from("profiles")
    .select("*")
    .order("full_name");

  const allProfiles = profiles ?? [];

  // Costruisci stats per tutti gli utenti
  const adminRows: UserStats[] = allProfiles.map((p: Profile) => ({
    profile: p,
    stats: countPeriods(allBookings.filter((b) => b.user_id === p.id)),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Riepilogo Prenotazioni</h1>
        <p className="text-gray-600 mt-1">Statistiche di prenotazione per utente</p>
      </div>

      <SeasonFilter
        seasons={(seasons ?? []) as Season[]}
        selectedSeasonId={selectedSeasonId}
      />

      {/* Report */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {adminRows.length > 0 ? (
          <AdminUsersReport users={adminRows} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun dato disponibile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
