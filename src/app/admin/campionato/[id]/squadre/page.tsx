import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import * as championships from "@/lib/supabase/championships";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminSquadreListPage({ params }: PageProps) {
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

  // Recupera squadre
  const { data: teams } = await dbClient
    .from("championship_teams")
    .select("*")
    .eq("championship_id", championshipId)
    .eq("status", "active")
    .order("name");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/campionato/${championshipId}`}
          className="text-blue-600 hover:underline"
        >
          ← Torna a modifica campionato
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Gestione Squadre</h1>
        <p className="text-gray-600 mt-1">{championship.name}</p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-4 mb-6 border-b">
        <Link href={`/admin/campionato/${championshipId}`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          Dettagli
        </Link>
        <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold">
          👥 Squadre
        </button>
        <Link href={`/admin/campionato/${championshipId}/partite`} className="px-4 py-2 text-gray-600 hover:text-gray-900">
          🏓 Partite
        </Link>
      </div>

      {/* TEAMS TABLE */}
      {teams && teams.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Serie</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Girone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team: any) => (
                <tr key={team.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{team.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{team.series}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{team.group_code}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {team.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link
                      href={`/admin/campionato/${championshipId}/squadre/${team.id}`}
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
          Nessuna squadra associata a questo campionato
        </div>
      )}
    </div>
  );
}
