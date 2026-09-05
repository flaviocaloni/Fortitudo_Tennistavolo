import { redirect } from "next/navigation";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/utils/roles";
import { toggleUserAutoBooking } from "@/lib/actions/auto-booking";
import { getProfilesByIds } from "@/lib/supabase/auto-booking";

export default async function AdminAutoBookingPage() {
  let error: string | null = null;
  let profile: any = null;
  let supabase: any = null;
  let users: any[] = [];
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
    // Get all users
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      error = `Errore lettura utenti: ${usersError.message}`;
    } else if (allUsers?.users) {
      const userIds = allUsers.users.map((u: any) => u.id);

      // Get profiles for these users
      const profiles = await getProfilesByIds(supabase, userIds);
      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

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
          users = allUsers.users
            .map((authUser: any) => {
              const prof = profileMap.get(authUser.id);
              return {
                id: authUser.id,
                email: authUser.email,
                name: prof?.full_name || "N/A",
                enabled: statusMap.get(authUser.id) || false,
                slotCount: countMap.get(authUser.id) || 0,
              };
            })
            .sort((a: any, b: any) => a.email.localeCompare(b.email));
        }
      }
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
          <div className="p-6 text-center text-gray-500">Nessun utente trovato</div>
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
