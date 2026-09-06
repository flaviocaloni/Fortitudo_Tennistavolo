import { redirect } from "next/navigation";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/utils/roles";
import { toggleUserAutoBooking } from "@/lib/actions/auto-booking";
import { getProfilesByIds } from "@/lib/supabase/auto-booking";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AutoBookingPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const searchTerm = (searchParams.search || "").toLowerCase().trim();

  let error: string | null = null;
  let profile: any = null;
  let supabase: any = null;
  let users: any[] = [];
  let allUsers: any[] = [];
  let autoBookingStatus: any[] = [];

  try {
    const result = await getSessionProfile();
    supabase = result.supabase;
    profile = result.profile;
  } catch (e: any) {
    error = `Errore autenticazione: ${e?.message || "Errore sconosciuto"}`;
  }

  if (!profile || !isSuperAdmin(profile.role)) {
    redirect("/calendario");
  }

  try {
    // Get all profiles from database
    const { data: allProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (profilesError) {
      error = `Errore lettura profili: ${profilesError.message}`;
    } else if (allProfiles && allProfiles.length > 0) {
      const profileMap = new Map(allProfiles.map((p: any) => [p.id, p]));

      // Get auto-booking status for all users
      const { data: statuses, error: statusError } = await supabase
        .from("user_auto_booking_enabled")
        .select("user_id, auto_booking_enabled");

      if (statusError) {
        error = `Errore lettura auto-booking: ${statusError.message}`;
      } else {
        const statusMap = new Map(
          (statuses || []).map((s: any) => [s.user_id, s.auto_booking_enabled])
        );

        // Get slot counts per user
        const { data: slotData, error: slotError } = await supabase
          .from("user_slot_auto_booking")
          .select("user_id, id");

        if (slotError) {
          error = `Errore lettura slot: ${slotError.message}`;
        } else {
          // Count slots per user
          const countMap = new Map<string, number>();
          (slotData || []).forEach((s: any) => {
            const count = (countMap.get(s.user_id) || 0) + 1;
            countMap.set(s.user_id, count);
          });

          // Build user list with auto-booking info
          allUsers = allProfiles.map((prof: any) => ({
            id: prof.id,
            email: prof.id.slice(0, 8) + "...",
            name: prof.full_name || "N/A",
            enabled: statusMap.get(prof.id) || false,
            slotCount: countMap.get(prof.id) || 0,
          }));

          // Filter by search term (name or partial id)
          if (searchTerm) {
            users = allUsers.filter((u: any) =>
              u.name.toLowerCase().includes(searchTerm) ||
              u.id.toLowerCase().includes(searchTerm)
            );
          } else {
            users = allUsers;
          }
        }
      }
    } else if (allProfiles?.length === 0) {
      // No users found, but no error
      users = [];
    }
  } catch (e: any) {
    error = `Errore server: ${e?.message || "Errore sconosciuto"}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Auto-Booking System</h1>
      <p className="text-gray-600 mb-8">Gestisci quale utenti hanno accesso alla feature auto-booking</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Cerca per nome o ID utente..."
            defaultValue={searchTerm}
            className="px-4 py-2 border border-gray-300 rounded-lg flex-1 text-sm"
          />
          <button type="submit" className="px-4 py-2 bg-navy-600 text-white rounded-lg font-semibold hover:bg-navy-700">
            Cerca
          </button>
          {searchTerm && (
            <a href="/sys/auto-booking" className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400">
              Cancella
            </a>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Slot Abilitati
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Auto-Booking
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {user.slotCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <form action={toggleUserAutoBooking}>
                    <input type="hidden" name="user_id" value={user.id} />
                    <input type="hidden" name="enabled" value={(!user.enabled).toString()} />
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        user.enabled
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {user.enabled ? "✅ Abilitato" : "❌ Disabilitato"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? "Nessun utente corrisponde alla ricerca" : "Nessun utente trovato"}
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Visualizzati {users.length} di {allUsers.length} utenti
        </div>
      )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Come funziona</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Clicca il pulsante per abilitare/disabilitare auto-booking per un utente</li>
          <li>• Utente potrà poi selezionare gli slot ricorrenti da auto-prenotare in /calendario/auto-booking</li>
          <li>• Ogni giorno, il sistema auto-prenota automaticamente le istanze future (30 giorni)</li>
        </ul>
      </div>
    </div>
  );
}
