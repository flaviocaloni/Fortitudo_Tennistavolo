import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { startOfISOWeek, toISODate } from "@/lib/dates";
import { getCurrentSeason } from "@/lib/settings";
import type { Booking, Season } from "@/lib/types";
import SeasonFilter from "@/components/season-filter";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

interface Periods {
  week: number;
  month: number;
  year: number;
  cancelled: number;
}

function countPeriods(bookings: Pick<Booking, "session_date" | "status">[]): Periods {
  const today = toISODate(new Date());
  const weekStart = startOfISOWeek(today);
  const monthPrefix = today.slice(0, 7);
  const yearPrefix = today.slice(0, 4);

  const res: Periods = { week: 0, month: 0, year: 0, cancelled: 0 };
  for (const b of bookings) {
    if (b.status === "cancelled") {
      if (b.session_date.startsWith(yearPrefix)) res.cancelled++;
      continue;
    }
    if (b.session_date.startsWith(yearPrefix)) res.year++;
    if (b.session_date.startsWith(monthPrefix)) res.month++;
    if (b.session_date >= weekStart) res.week++;
  }
  return res;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-bold text-navy-700">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default async function StatistichePage(props: {
  searchParams: Promise<{ season?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  const year = new Date().getFullYear();

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
    .eq("user_id", user.id)
    .gte("session_date", minDate)
    .order("session_date", { ascending: false });

  if (selectedSeasonId !== "all") {
    query = query.eq("season_id", selectedSeasonId);
  }

  const { data: bookings } = await query;

  const mineAll = bookings ?? [];
  const my = countPeriods(mineAll);

  const monthly = Array(12).fill(0) as number[];
  for (const b of mineAll) {
    if (b.status !== "cancelled" && b.session_date.startsWith(String(year))) {
      monthly[Number(b.session_date.slice(5, 7)) - 1]++;
    }
  }
  const maxMonthly = Math.max(1, ...monthly);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Statistiche</h1>

      <SeasonFilter seasons={(seasons ?? []) as Season[]} selectedSeasonId={selectedSeasonId} />

      <h2 className="mb-2 font-semibold text-slate-700">Le mie prenotazioni</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Questa settimana" value={my.week} />
        <StatCard label="Questo mese" value={my.month} />
        <StatCard label={`Anno ${year}`} value={my.year} />
        <StatCard label={`Cancellate ${year}`} value={my.cancelled} />
      </div>

      <h2 className="mb-2 font-semibold text-slate-700">
        Andamento mensile {year}
      </h2>
      <div className="card flex items-end gap-2" style={{ height: 160 }}>
        {monthly.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-slate-600">{v || ""}</span>
            <div
              className="w-full rounded-t bg-navy-500"
              style={{ height: `${(v / maxMonthly) * 100}px` }}
            />
            <span className="text-[10px] text-slate-500">{MONTHS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
