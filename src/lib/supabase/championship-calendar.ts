import { SupabaseClient } from "@supabase/supabase-js";

export interface ChampionshipMatch {
  id: string;
  date: string;
  start_time: string;
  team_name: string;
  series: string;
  round_name: string;
  opponent: string;
  location: string;
  address?: string;
  is_home: boolean;
}

export interface GroupedMatches {
  date: string;
  time: string;
  location: string;
  is_home: boolean;
  matches: ChampionshipMatch[];
}

export async function getChampionshipMatches(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<Record<string, GroupedMatches>> {
  const { data, error } = await supabase
    .from("campionato_calendario")
    .select("id, data, ora_inizio, nome_squadra, serie, girone, avversario, sede, in_casa")
    .gte("data", fromDate)
    .lte("data", toDate)
    .eq("is_active", true)
    .order("data", { ascending: true })
    .order("ora_inizio", { ascending: true });

  if (error) {
    console.error("Error fetching championship matches:", error);
    return {};
  }

  if (!data) return {};

  const seriesOrder: Record<string, number> = {
    "D1": 1,
    "D2": 2,
    "D3": 3,
  };

  const grouped: Record<string, GroupedMatches> = {};

  for (const match of data) {
    const key = `${match.data}|${match.ora_inizio}|${match.sede}|${match.in_casa}`;

    if (!grouped[key]) {
      grouped[key] = {
        date: match.data,
        time: match.ora_inizio,
        location: match.sede,
        is_home: match.in_casa,
        matches: [],
      };
    }

    grouped[key].matches.push({
      id: match.id,
      date: match.data,
      start_time: match.ora_inizio,
      team_name: match.nome_squadra,
      series: match.serie,
      round_name: match.girone,
      opponent: match.avversario,
      location: match.sede,
      is_home: match.in_casa,
    });
  }

  // Sort matches by series descending (D1 first)
  for (const key in grouped) {
    grouped[key].matches.sort((a, b) => {
      const aOrder = seriesOrder[a.series] ?? 999;
      const bOrder = seriesOrder[b.series] ?? 999;
      return aOrder - bOrder;
    });
  }

  return grouped;
}

export interface ChampionshipMatchByDate {
  date: string;
  hasHome: boolean;
  hasAway: boolean;
  matchCount: number;
  matches: ChampionshipMatch[];
}

export async function getChampionshipMatchesByDate(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<Map<string, ChampionshipMatchByDate>> {
  const { data, error } = await supabase
    .from("championship_matches")
    .select(`
      id,
      scheduled_start_at,
      venue_type,
      opponent_name,
      venue_name,
      address,
      championship_teams!inner(
        id,
        name,
        series,
        group_code
      )
    `)
    .gte("scheduled_start_at", `${fromDate}T00:00:00`)
    .lte("scheduled_start_at", `${toDate}T23:59:59`)
    .order("scheduled_start_at", { ascending: true });

  if (error) {
    console.error("Error fetching championship matches by date:", error);
    return new Map();
  }

  if (!data) return new Map();

  const byDate = new Map<string, ChampionshipMatchByDate>();

  for (const match of data as any) {
    const dateStr = match.scheduled_start_at.split("T")[0];
    const isHome = match.venue_type === "HOME";

    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, {
        date: dateStr,
        hasHome: false,
        hasAway: false,
        matchCount: 0,
        matches: [],
      });
    }

    const dateEntry = byDate.get(dateStr)!;
    dateEntry.matchCount++;
    if (isHome) {
      dateEntry.hasHome = true;
    } else {
      dateEntry.hasAway = true;
    }

    dateEntry.matches.push({
      id: match.id,
      date: dateStr,
      start_time: match.scheduled_start_at.split("T")[1].slice(0, 5),
      team_name: match.championship_teams?.name || "Unknown",
      series: match.championship_teams?.series || "",
      round_name: match.championship_teams?.group_code || "",
      opponent: match.opponent_name,
      location: match.venue_name,
      address: match.address,
      is_home: isHome,
    });
  }

  return byDate;
}

export async function getChampionshipMatchesAll(
  supabase: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<Record<string, GroupedMatches>> {
  const { data, error } = await supabase
    .from("championship_matches")
    .select(`
      id,
      scheduled_start_at,
      venue_type,
      opponent_name,
      venue_name,
      address,
      championship_teams!inner(
        id,
        name,
        series,
        group_code
      )
    `)
    .gte("scheduled_start_at", `${fromDate}T00:00:00`)
    .lte("scheduled_start_at", `${toDate}T23:59:59`)
    .order("scheduled_start_at", { ascending: true });

  if (error) {
    console.error("Error fetching all championship matches:", error);
    return {};
  }

  console.log(`[getChampionshipMatchesAll] Fetched ${data?.length || 0} matches from ${fromDate} to ${toDate}`);

  if (!data) return {};

  const seriesOrder: Record<string, number> = {
    "D1": 1,
    "D2": 2,
    "D3": 3,
  };

  const grouped: Record<string, GroupedMatches> = {};

  for (const match of data as any) {
    const dateStr = match.scheduled_start_at.split("T")[0];
    const timeStr = match.scheduled_start_at.split("T")[1].slice(0, 5);
    const isHome = match.leg_type === "HOME";
    const key = `${dateStr}|${timeStr}|${match.venue_name}|${isHome}`;

    if (!grouped[key]) {
      grouped[key] = {
        date: dateStr,
        time: timeStr,
        location: match.venue_name,
        is_home: isHome,
        matches: [],
      };
    }

    grouped[key].matches.push({
      id: match.id,
      date: dateStr,
      start_time: timeStr,
      team_name: match.championship_teams?.name || "Unknown",
      series: match.championship_teams?.series || "",
      round_name: match.championship_teams?.group_code || "",
      opponent: match.opponent_name,
      location: match.venue_name,
      is_home: isHome,
    });
  }

  // Sort matches by series ascending (D1 first)
  for (const key in grouped) {
    grouped[key].matches.sort((a, b) => {
      const aOrder = seriesOrder[a.series] ?? 999;
      const bOrder = seriesOrder[b.series] ?? 999;
      return aOrder - bOrder;
    });
  }

  return grouped;
}
