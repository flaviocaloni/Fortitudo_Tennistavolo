import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import CertificateReportClient from "@/components/certificate-report-client";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CertificatiStatistichePage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const admin = createAdminClient();
  const dbClient = admin || supabase;

  const searchTerm = searchParams.search?.toLowerCase() || "";

  // Se c'è ricerca, filtra per nome o ID
  // Altrimenti carica tutti i profili
  let profilesQuery = dbClient
    .from("profiles")
    .select("*")
    .order("full_name");

  if (searchTerm) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
  }

  const { data: profiles } = await profilesQuery;
  const allProfiles = (profiles ?? []) as Profile[];

  const resultLabel = searchTerm
    ? `Risultati per "${searchTerm}" (${allProfiles.length})`
    : `Tutti gli utenti (${allProfiles.length})`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Certificati Medici</h1>
        <p className="text-gray-600 mt-1">Monitoraggio scadenze certificati medici</p>
      </div>

      {/* Ricerca Utente */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ricerca Utente</h2>
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Digita nome o ID utente..."
            defaultValue={searchTerm}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
          >
            Cerca
          </button>
          {searchTerm && (
            <Link
              href="/admin/statistiche/certificati"
              className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition"
            >
              Resetta
            </Link>
          )}
        </form>
      </div>

      {/* Risultati */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{resultLabel}</h2>
        {allProfiles.length > 0 ? (
          <CertificateReportClient profiles={allProfiles} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun utente trovato{searchTerm ? ` per "${searchTerm}"` : ""}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
