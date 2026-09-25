import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import * as championships from "@/lib/supabase/championships";
import { isAdmin } from "@/lib/utils/roles";
import ImportExportClient from "@/components/admin-matches-import-export";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminMatchesImportExportPage({ params }: PageProps) {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/campionato");
  }

  const { id: championshipId } = await params;

  // Recupera campionato
  const { data: championship, error: champError } =
    await championships.getChampionshipById(supabase, championshipId);

  if (champError || !championship) {
    notFound();
  }

  // Recupera squadre e partite
  const [{ data: teams }, { data: matches }] = await Promise.all([
    championships.getTeamsByChampionshipId(supabase, championshipId),
    championships.getMatchesByChampionshipId(supabase, championshipId),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/admin/campionato/${championshipId}/partite`}
          className="text-blue-600 hover:underline"
        >
          ← Torna alle partite
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Import/Export Partite - {championship.name}
        </h1>
      </div>

      <ImportExportClient
        championshipId={championshipId}
        teams={teams || []}
        existingMatches={matches || []}
      />
    </div>
  );
}
