import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import { updateChampionship } from "@/lib/actions/championships";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminChampionatoDetailPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;

  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  // Use admin client to bypass RLS
  const admin = createAdminClient();
  const dbClient = admin || supabase;

  // Fetch championship
  const { data: championship, error: champError } = await dbClient
    .from("championships")
    .select("*")
    .eq("id", id)
    .single();

  if (champError || !championship) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Campionato non trovato</h1>
        <Link href="/admin/campionato" className="text-blue-600 hover:underline">
          Torna alla lista
        </Link>
      </div>
    );
  }

  // Fetch seasons
  const { data: seasons } = await dbClient
    .from("seasons")
    .select("id, name, is_current")
    .order("start_date", { ascending: false });

  // Fetch teams count for this championship
  const { data: teams, error: teamsError } = await dbClient
    .from("championship_teams")
    .select("id, name, series, group_code")
    .eq("championship_id", id)
    .eq("status", "active");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin/campionato" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Torna alla lista campionati
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifica Campionato</h1>

      {/* EDIT FORM */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form action={updateChampionship} className="space-y-4">
          <input type="hidden" name="id" value={championship.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stagione *
              </label>
              <select
                name="season_id"
                defaultValue={championship.season_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleziona stagione</option>
                {seasons?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_current ? "(Corrente)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Campionato *
              </label>
              <input
                type="text"
                name="name"
                defaultValue={championship.name}
                placeholder="es: Campionato Serie D3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                name="status"
                defaultValue={championship.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Attivo</option>
                <option value="closed">Chiuso</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Salva Modifiche
          </button>
        </form>
      </div>

      {/* TEAMS INFO */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Squadre ({teams?.length || 0})</h2>

        {teams && teams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Serie</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Girone</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team: any) => (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{team.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{team.series}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{team.group_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nessuna squadra assegnata</p>
        )}
      </div>
    </div>
  );
}
