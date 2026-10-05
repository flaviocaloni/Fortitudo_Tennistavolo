import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";
import { getPizzaStats } from "@/lib/supabase/pizza-stats";
import PizzaStatsCard from "@/components/admin/pizza-stats-card";

export const dynamic = "force-dynamic";

export default async function PizzaStatistichePage() {
  const { profile, supabase } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/calendario");
  }

  const pizzaStats = await getPizzaStats(supabase);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin/statistiche" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Torna alle Statistiche
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">🍕 Statistiche Pizza</h1>
        <p className="text-gray-600 mt-2">Panoramica su slot pizza, prenotazioni e partecipanti</p>
      </div>

      <div className="max-w-md mb-8">
        <PizzaStatsCard stats={pizzaStats} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dettagli</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            <strong>Slot Pizza totali:</strong> {pizzaStats.totalPizzas}
          </li>
          <li>
            <strong>Prenotazioni attive:</strong> {pizzaStats.totalBookings}
          </li>
          <li>
            <strong>Media partecipanti per prenotazione:</strong> {pizzaStats.avgParticipants}
          </li>
          <li>
            <strong>Pizza in calendario (future):</strong> {pizzaStats.upcomingPizzas}
          </li>
          <li>
            <strong>Pizza completate (passate):</strong> {pizzaStats.pastPizzas}
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/slot/pizza"
          className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          Gestisci Slot Pizza →
        </Link>
      </div>
    </div>
  );
}
