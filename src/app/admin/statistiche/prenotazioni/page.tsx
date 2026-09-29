import { redirect } from "next/navigation";
import Link from "next/link";
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

  // Se c'è ricerca per utente, carica solo quel profilo
  // Altrimenti carica tutti i profili
  const searchTerm = searchParams.search?.toLowerCase() || "";

  let profilesQuery = dbClient
    .from("profiles")
    .select("*")
    .order("full_name");

  if (searchTerm) {
    // Se ricerca è specificata, filtra per nome o ID
    profilesQuery = profilesQuery.or(`full_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
  }

  const { data: profiles } = await profilesQuery;
  const allProfiles = profiles ?? [];

  // Costruisci stats per gli utenti trovati
  const adminRows: UserStats[] = allProfiles.map((p: Profile) => ({
    profile: p,
    stats: countPeriods(allBookings.filter((b) => b.user_id === p.id)),
  }));

  const resultLabel = searchTerm
    ? `Risultati per "${searchTerm}" (${adminRows.length})`
    : `Tutti gli utenti (${adminRows.length})`;

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

      {/* Ricerca Utente */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ricerca Utente</h2>
        <form method="get" className="flex gap-2">
          <input
            type="hidden"
            name="season"
            value={selectedSeasonId}
          />
          <input
            type="text"
            name="search"
            placeholder="Digita nome o ID utente..."
            defaultValue={searchTerm}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Cerca
          </button>
          {searchTerm && (
            <Link
              href={`/admin/statistiche/prenotazioni?season=${selectedSeasonId}`}
              className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition"
            >
              Resetta
            </Link>
          )}
        </form>
      </div>

      {/* Risultati */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{resultLabel}</h2>
        {adminRows.length > 0 ? (
          <AdminUsersReport users={adminRows} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun utente trovato{searchTerm ? ` per "${searchTerm}"` : ""}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
