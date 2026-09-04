import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import CalendarioFilters from "@/components/calendario-filters";

interface PageProps {
  params: Promise<{ championshipId: string }>;
}

export default async function CalendarioPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  const { championshipId } = await params;

  // Recupera campionato
  const { data: championship } = await championships.getChampionshipById(
    supabase,
    championshipId
  );

  if (!championship) {
    redirect("/campionato");
  }

  // Recupera tutte le partite del campionato
  const { data: matches } = await championships.getMatchesByChampionshipId(
    supabase,
    championshipId
  );

  // Recupera squadre per il filtro
  const { data: teams } = await supabase
    .from("championship_teams")
    .select("id, name")
    .eq("championship_id", championshipId)
    .eq("status", "active")
    .order("name");

  // Recupera dati completi delle squadre per i filtri
  const { data: teamsFullData } = await supabase
    .from("championship_teams")
    .select("id, name, series, group_code")
    .eq("championship_id", championshipId)
    .eq("status", "active");

  const teamsMap = new Map(
    teamsFullData?.map((t: any) => [
      t.id,
      { name: t.name, series: t.series, group_code: t.group_code },
    ]) || []
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href={`/campionato`} className="text-blue-600 hover:underline">
          ← Torna a campionati
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          {championship.name} — Calendario
        </h1>
      </div>

      {matches && matches.length > 0 ? (
        <CalendarioFilters matches={matches} teamsData={teamsMap} />
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Nessuna partita programmata per questo campionato.</p>
        </div>
      )}
    </div>
  );
}
