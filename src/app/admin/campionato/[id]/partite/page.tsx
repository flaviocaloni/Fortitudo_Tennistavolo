import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";

interface PageProps {
  params: Promise<{ id: string }>;
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

export default async function AdminPartiteListPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  const { id: championshipId } = await params;

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

  // Recupera partite
  const { data: matches } = await dbClient
    .from("championship_matches")
    .select(`
      *,
      home_team:home_team_id(name, series),
      away_team:away_team_id(name, series)
    `)
    .eq("championship_id", championshipId)
    .order("match_date", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/campionato/${championshipId}`}
          className="text-blue-600 hover:underline"
        >
          ← Torna a modifica campionato
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Gestione Partite</h1>
        <p className="text-gray-600 mt-1">{championship.name}</p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-4 mb-6 border-b">
        <Link href={`/admin/campionato/${championshipId}`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          Dettagli
        </Link>
        <Link href={`/admin/campionato/${championshipId}/squadre`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          👥 Squadre
        </Link>
        <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold">
          🏓 Partite
        </button>
      </div>

      {/* MATCHES TABLE */}
      {matches && matches.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Girone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Partita</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Risultato</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match: any) => (
                <tr key={match.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(match.match_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{match.group_code}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {match.home_goals !== null && match.away_goals !== null ? (
                      <span className="font-semibold">
                        {match.home_goals} - {match.away_goals}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link
                      href={`/admin/campionato/${championshipId}/partite/${match.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          Nessuna partita associata a questo campionato
        </div>
      )}
    </div>
  );
}
