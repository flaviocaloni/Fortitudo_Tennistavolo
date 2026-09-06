import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";

interface PageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPartitaDetailPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  const { id: championshipId, matchId } = await params;

  // Use admin client to bypass RLS
  const admin = createAdminClient();
  const dbClient = admin || supabase;

  // Recupera campionato
  const { data: championship, error: champError } = await dbClient
    .from("championships")
    .select("*")
    .eq("id", championshipId)
    .single();

  if (champError || !championship) {
    notFound();
  }

  // Recupera partita con dettagli squadre
  const { data: match, error: matchError } = await dbClient
    .from("championship_matches")
    .select(`
      *,
      home_team:home_team_id(id, name, series),
      away_team:away_team_id(id, name, series)
    `)
    .eq("id", matchId)
    .single();

  if (matchError || !match || match.championship_id !== championshipId) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/campionato/${championshipId}/partite`}
          className="text-blue-600 hover:underline"
        >
          ← Torna alla lista partite
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Dettagli Partita</h1>
      </div>

      {/* MATCH INFO */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Informazioni Partita</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data/Ora</label>
            <p className="text-gray-900 font-medium">{formatDate(match.match_date)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Girone</label>
            <p className="text-gray-900 font-medium">{match.group_code}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Luogo</label>
            <p className="text-gray-900 font-medium">{match.location || "—"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <p className="text-gray-900 font-medium">{match.status}</p>
          </div>
        </div>

        {/* TEAMS AND SCORE */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Squadre e Risultato</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Casa</p>
              <p className="text-lg font-bold text-gray-900">{match.home_team?.name}</p>
              <p className="text-xs text-gray-500 mt-1">{match.home_team?.series}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Risultato</p>
              {match.home_goals !== null && match.away_goals !== null ? (
                <p className="text-3xl font-bold text-gray-900">
                  {match.home_goals} - {match.away_goals}
                </p>
              ) : (
                <p className="text-lg text-gray-400">—</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Trasferta</p>
              <p className="text-lg font-bold text-gray-900">{match.away_team?.name}</p>
              <p className="text-xs text-gray-500 mt-1">{match.away_team?.series}</p>
            </div>
          </div>
        </div>

        {/* ADDITIONAL INFO */}
        {(match.notes || match.referee_notes) && (
          <div className="border-t mt-6 pt-6">
            <h3 className="font-semibold text-gray-800 mb-4">Note</h3>
            {match.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Partita</p>
                <p className="text-gray-900">{match.notes}</p>
              </div>
            )}
            {match.referee_notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Arbitro</p>
                <p className="text-gray-900">{match.referee_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
