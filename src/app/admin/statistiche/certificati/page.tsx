import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/roles";
import CertificateReportClient from "@/components/certificate-report-client";
import type { Profile } from "@/lib/types"; // Link kept for back navigation

export const dynamic = "force-dynamic";

export default async function CertificatiStatistichePage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const admin = createAdminClient();
  const dbClient = admin || supabase;

  // Carica tutti i profili
  const { data: profiles } = await dbClient
    .from("profiles")
    .select("*")
    .order("full_name");

  const allProfiles = (profiles ?? []) as Profile[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Certificati Medici</h1>
        <p className="text-gray-600 mt-1">Monitoraggio scadenze certificati medici</p>
      </div>

      {/* Report */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {allProfiles.length > 0 ? (
          <CertificateReportClient profiles={allProfiles} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun utente disponibile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
