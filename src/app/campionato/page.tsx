import { redirect } from "next/navigation";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";

export default async function CampionatoPage() {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  // Recupera stagioni
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, is_current")
    .order("start_date", { ascending: false });

  // Recupera il campionato della stagione corrente (o prima stagione disponibile)
  const currentSeason = seasons?.find((s: any) => s.is_current) || seasons?.[0];

  let currentChampionship = null;
  if (currentSeason) {
    const { data: champ } = await championships.getChampionshipsBySeasonId(
      supabase,
      currentSeason.id
    );
    currentChampionship = champ?.[0];
  }

  // Se utente è agonista, trova la sua squadra
  let userTeam = null;
  if (profile.role === "agonista" && profile.squadra) {
    const { data: teams } = await supabase
      .from("championship_teams")
      .select("*")
      .eq("id", profile.squadra)
      .single();
    userTeam = teams;
  }

  // Conta squadre attive
  let teamsCount = 0;
  if (currentChampionship) {
    const { count } = await supabase
      .from("championship_teams")
      .select("*", { count: "exact", head: true })
      .eq("championship_id", currentChampionship.id)
      .eq("status", "active");
    teamsCount = count || 0;
  }

  // Conta partite programmate e completate
  let scheduledCount = 0;
  let completedCount = 0;
  if (currentChampionship) {
    const { count: scheduled } = await supabase
      .from("championship_matches")
      .select("*", { count: "exact", head: true })
      .eq("championship_id", currentChampionship.id)
      .eq("status", "SCHEDULED");
    scheduledCount = scheduled || 0;

    const { count: completed } = await supabase
      .from("championship_matches")
      .select("*", { count: "exact", head: true })
      .eq("championship_id", currentChampionship.id)
      .eq("status", "PLAYED");
    completedCount = completed || 0;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Campionato</h1>
      <p className="text-gray-600 mb-8">Visualizza e gestisci il campionato della tua squadra</p>

      {!currentChampionship ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">
            Nessun campionato disponibile per la stagione corrente.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* CHAMPIONSHIP HEADER */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentChampionship.name}
            </h2>
            <p className="text-gray-600 mt-2">
              Stagione: {currentSeason?.name}
            </p>
          </div>

          {/* USER TEAM INFO */}
          {profile.role === "agonista" && userTeam && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900">La tua squadra</h3>
              <p className="text-green-800 mt-2">
                <strong>{userTeam.name}</strong> - Serie {userTeam.series}, Girone{" "}
                {userTeam.group_code}
              </p>
              <a
                href={`/campionato/${currentChampionship.id}/squadra/${userTeam.id}`}
                className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Visualizza squadra e partite
              </a>
            </div>
          )}

          {/* CHAMPIONSHIP STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-600 text-sm font-semibold uppercase">
                Squadre
              </div>
              <div className="text-4xl font-bold text-gray-900 mt-2">
                {teamsCount}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-600 text-sm font-semibold uppercase">
                Partite Programmate
              </div>
              <div className="text-4xl font-bold text-gray-900 mt-2">
                {scheduledCount}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-600 text-sm font-semibold uppercase">
                Partite Completate
              </div>
              <div className="text-4xl font-bold text-gray-900 mt-2">
                {completedCount}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigazione</h3>
            <div className="space-y-3">
              <a
                href={`/campionato/${currentChampionship.id}/squadre`}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <span className="mr-2">→</span>
                Visualizza tutte le squadre
              </a>
              <a
                href={`/campionato/${currentChampionship.id}/calendario`}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <span className="mr-2">→</span>
                Calendario partite
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
