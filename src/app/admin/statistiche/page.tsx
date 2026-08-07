import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { getCurrentSeason } from "@/lib/settings";
import type { Booking, Profile, Season } from "@/lib/types";
import AdminBookingsChart from "@/components/admin-bookings-chart";
import AdminUsersReport from "@/components/admin-users-report";
import CertificateReportClient from "@/components/certificate-report-client";
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

export default async function AdminStatistichePage(props: {
  searchParams: Promise<{ season?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("start_date", { ascending: false });
  const currentSeason = await getCurrentSeason(supabase);
  const selectedSeasonId = searchParams.season || currentSeason?.id || "all";

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const minDate = twoYearsAgo.toISOString().split("T")[0];

  let query = supabase
    .from("bookings")
    .select("id, slot_id, user_id, session_date, status, created_at, cancelled_at, season_id")
    .gte("session_date", minDate)
    .order("session_date", { ascending: false });

  if (selectedSeasonId !== "all") {
    query = query.eq("season_id", selectedSeasonId);
  }

  const { data: bookings } = await query;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  const allVisible = bookings ?? [];
  const allProfiles = profiles ?? [];

  const adminRows = allProfiles.map((p: Profile) => ({
    profile: p,
    stats: countPeriods((allVisible).filter((b) => b.user_id === p.id)),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Statistiche Amministrative</h1>

      <SeasonFilter seasons={(seasons ?? []) as Season[]} selectedSeasonId={selectedSeasonId} />

      <AdminBookingsChart bookings={allVisible} />

      <h2 className="my-8 font-semibold text-amber-700">
        Riepilogo per utente
      </h2>
      <AdminUsersReport users={adminRows} />

      <h2 className="my-8 font-semibold text-amber-700">
        Certificati medici
      </h2>
      <CertificateReportClient profiles={allProfiles} />
    </div>
  );
}
