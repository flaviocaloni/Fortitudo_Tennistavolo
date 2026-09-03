import { redirect } from "next/navigation";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import {
  createChampionship,
  updateChampionship,
  deleteChampionship,
} from "@/lib/actions/championships";

export default async function AdminChampionatoPage() {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/campionato");
  }

  // Recupera stagioni
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, is_current")
    .order("start_date", { ascending: false });

  // Recupera campionati
  const { data: allChampionships, error: champError } = await supabase
    .from("championships")
    .select("id, name, status, season_id, created_at")
    .order("created_at", { ascending: false });

  const error = champError?.message || null;

  // Mappa stagioni per lookup
  const seasonMap = new Map(seasons?.map((s: any) => [s.id, s.name]) || []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestione Campionati</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* CREATE CHAMPIONSHIP FORM */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Crea Nuovo Campionato</h2>

        <form action={createChampionship} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stagione *
              </label>
              <select
                name="season_id"
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
                placeholder="es: Campionato Serie D3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crea Campionato
          </button>
        </form>
      </div>

      {/* CHAMPIONSHIPS LIST */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Stagione
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody>
            {allChampionships?.map((champ: any) => (
              <tr key={champ.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {champ.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {seasonMap.get(champ.season_id)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {champ.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  <a
                    href={`/admin/campionato/${champ.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Modifica
                  </a>
                  <form
                    action={deleteChampionship}
                    className="inline"
                    onSubmit={(e) => {
                      if (!confirm("Confermi l'eliminazione?")) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="championship_id" value={champ.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Elimina
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!allChampionships?.length && (
          <div className="p-6 text-center text-gray-500">
            Nessun campionato ancora. Creane uno nuovo.
          </div>
        )}
      </div>
    </div>
  );
}
