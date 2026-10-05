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
