import { notFound, redirect } from "next/redirect";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";

interface PageProps {
  params: Promise<{ championshipId: string }>;
}

export default async function SquadreListPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  const { championshipId } = await params;

  // Recupera campionato
  const { data: championship, error: champError } =
    await championships.getChampionshipById(supabase, championshipId);

  if (champError || !championship) {
    notFound();
  }

  // Recupera squadre
  const { data: teams } = await championships.getTeamsByChampionshipId(
    supabase,
    championshipId
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href={`/campionato/${championshipId}`} className="text-blue-600 hover:underline">
          ← Torna al campionato
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Squadre</h1>
        <p className="text-gray-600 mt-1">{championship.name}</p>
      </div>

      {/* TEAMS GRID */}
      {teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: any) => (
            <Link
              key={team.id}
              href={`/campionato/${championshipId}/squadra/${team.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 group"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                  {team.name}
                </h2>
                <div className="text-sm text-gray-600 mt-2">
                  <div>
                    <span className="font-semibold">Serie:</span> {team.series}
                  </div>
                  <div>
                    <span className="font-semibold">Girone:</span> {team.group_code}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-blue-600 group-hover:text-blue-800 transition">
                <span>Visualizza dettagli</span>
                <span className="ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-blue-800">
          Nessuna squadra nel campionato.
        </div>
      )}
    </div>
  );
}
