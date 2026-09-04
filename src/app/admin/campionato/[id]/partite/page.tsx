import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import { createMatch, deleteMatch, updateMatch } from "@/lib/actions/championships";
import ConfirmDeleteButton from "@/components/confirm-delete-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  championshipId,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  currentOrder: string;
  championshipId: string;
}) {
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  params.set("sort", sortKey);
  params.set("order", nextOrder);

  return (
    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
      <Link
        href={`?${params.toString()}`}
        className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
      >
        {label}
        {isActive && (
          <span className="text-xs">
            {currentOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </Link>
    </th>
  );
}

export default async function AdminChampionatoMatchesPage({ params, searchParams }: PageProps & { searchParams: Promise<Record<string, string>> }) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/campionato");
  }

  const { id: championshipId } = await params;
  const { sort = "scheduled_start_at", order = "asc" } = await searchParams;

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

  // Mappa team_id a team info
  const teamMap = new Map(teams?.map((t: any) => [t.id, t]) || []);

  // Recupera partite
  const { data: matches } = await championships.getMatchesByChampionshipId(
    supabase,
    championshipId
  );

  // Ordina partite
  let sortedMatches = matches || [];
  sortedMatches = sortedMatches.sort((a: any, b: any) => {
    let aVal: any = a[sort as keyof typeof a];
    let bVal: any = b[sort as keyof typeof b];

    if (sort === "team_id") {
      aVal = teamMap.get(a.team_id)?.name || "";
      bVal = teamMap.get(b.team_id)?.name || "";
    }

    if (typeof aVal === "string") {
      return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return order === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href={`/admin/campionato/${championshipId}`} className="text-blue-600 hover:underline">
          ← Torna a {championship.name}
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Partite del Campionato</h1>
      </div>

      {/* CREATE MATCH FORM */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Crea Nuova Partita</h2>

        <form action={createMatch} className="space-y-6">
          <input type="hidden" name="championship_id" value={championshipId} />
          <input type="hidden" name="season_id" value={championship.season_id} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Squadra *
              </label>
              <select
                name="team_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleziona squadra</option>
                {teams?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avversario *
              </label>
              <input
                type="text"
                name="opponent_name"
                placeholder="es: Squadra XYZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Società Avversaria
              </label>
              <input
                type="text"
                name="opponent_club_name"
                placeholder="es: Società XYZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Gara *
              </label>
              <select
                name="leg_type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="SINGLE">Singola</option>
                <option value="FIRST_LEG">Andata</option>
                <option value="RETURN_LEG">Ritorno</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sede *
              </label>
              <select
                name="venue_type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="HOME">Casa</option>
                <option value="AWAY">Trasferta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data e Ora *
              </label>
              <input
                type="datetime-local"
                name="scheduled_start_at"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Luogo
              </label>
              <input
                type="text"
                name="venue_name"
                placeholder="es: Palestra X"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo
            </label>
            <input
              type="text"
              name="address"
              placeholder="Indirizzo completo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              name="notes"
              placeholder="Note aggiuntive..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crea Partita
          </button>
        </form>
      </div>

      {/* MATCHES TABLE */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <SortableHeader
                label="Data"
                sortKey="scheduled_start_at"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <SortableHeader
                label="Squadra"
                sortKey="team_id"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <SortableHeader
                label="Serie"
                sortKey="series"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <SortableHeader
                label="Girone"
                sortKey="group_code"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <SortableHeader
                label="Avversario"
                sortKey="opponent_name"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <SortableHeader
                label="Tipo"
                sortKey="leg_type"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <SortableHeader
                label="Stato"
                sortKey="status"
                currentSort={sort}
                currentOrder={order}
                championshipId={championshipId}
              />
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMatches?.map((match: any) => {
              const team = teamMap.get(match.team_id);
              return (
                <tr key={match.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(match.scheduled_start_at).toLocaleDateString("it-IT", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {team?.name || match.team_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {team?.series || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {team?.group_code || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {match.opponent_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {match.leg_type === "SINGLE" && "Singola"}
                    {match.leg_type === "FIRST_LEG" && "Andata"}
                    {match.leg_type === "RETURN_LEG" && "Ritorno"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {match.status === "SCHEDULED" && "Programmata"}
                      {match.status === "COMPLETED" && "Completata"}
                      {match.status === "CANCELLED" && "Annullata"}
                      {match.status === "POSTPONED" && "Rinviata"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <a
                      href={`/admin/campionato/${championshipId}/partite/${match.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Presenze
                    </a>
                    <form action={deleteMatch} className="inline">
                      <input type="hidden" name="match_id" value={match.id} />
                      <input type="hidden" name="championship_id" value={championshipId} />
                      <ConfirmDeleteButton />
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!matches?.length && (
          <div className="p-6 text-center text-gray-500">
            Nessuna partita ancora. Creane una nuova.
          </div>
        )}
      </div>
    </div>
  );
}
