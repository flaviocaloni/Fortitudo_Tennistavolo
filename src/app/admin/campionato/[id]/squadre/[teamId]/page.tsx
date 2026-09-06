import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";

interface PageProps {
  params: Promise<{ id: string; teamId: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminSquadraDetailPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  const { id: championshipId, teamId } = await params;

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

  // Recupera squadra
  const { data: team, error: teamError } = await dbClient
    .from("championship_teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team || team.championship_id !== championshipId) {
    notFound();
  }

  // Recupera giocatori della squadra
  const { data: players } = await dbClient
    .from("championship_team_players")
    .select(`
      *,
      profiles:profiles(id, full_name, role)
    `)
    .eq("team_id", teamId)
    .order("joined_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/campionato/${championshipId}/squadre`}
          className="text-blue-600 hover:underline"
        >
          ← Torna alla lista squadre
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Dettagli Squadra</h1>
        <p className="text-gray-600 mt-1">{team.name}</p>
      </div>

      {/* TEAM INFO */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Informazioni Squadra</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Squadra</label>
            <p className="text-gray-900 font-medium">{team.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
            <p className="text-gray-900 font-medium">{team.series}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Girone</label>
            <p className="text-gray-900 font-medium">{team.group_code}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <p className="text-gray-900 font-medium">{team.status}</p>
          </div>
        </div>
      </div>

      {/* PLAYERS LIST */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Giocatori ({players?.length || 0})</h2>

        {players && players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profilo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data Iscrizione</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player: any) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {player.profiles?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {player.profiles?.role || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          player.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {player.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(player.joined_at).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nessun giocatore iscritto</p>
        )}
      </div>
    </div>
  );
}
