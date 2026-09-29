import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";

export const dynamic = "force-dynamic";

export default async function AdminStatistichePage() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Statistiche Amministrative</h1>
      <p className="mb-8 text-gray-600">Seleziona una sezione per visualizzare i dettagli</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prenotazioni */}
        <Link
          href="/admin/statistiche/prenotazioni"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-600"
        >
          <div className="text-2xl font-bold text-blue-600 mb-2">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Riepilogo Prenotazioni</h2>
          <p className="text-sm text-gray-600">
            Visualizza statistiche di prenotazione per utente. Ricerca per nome o ID.
          </p>
        </Link>

        {/* Certificati */}
        <Link
          href="/admin/statistiche/certificati"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-green-600"
        >
          <div className="text-2xl font-bold text-green-600 mb-2">🏥</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificati Medici</h2>
          <p className="text-sm text-gray-600">
            Monitora scadenze certificati. Filtra per stato (valido, scaduto, etc).
          </p>
        </Link>

        {/* Grafico */}
        <Link
          href="/admin/statistiche/booking-chart"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-amber-600"
        >
          <div className="text-2xl font-bold text-amber-600 mb-2">📈</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Grafico Prenotazioni</h2>
          <p className="text-sm text-gray-600">
            Visualizza trend prenotazioni per stagione e periodo.
          </p>
        </Link>
      </div>
    </div>
  );
}
