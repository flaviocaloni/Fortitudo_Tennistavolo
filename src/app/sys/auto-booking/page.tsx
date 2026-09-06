import { redirect } from "next/navigation";
import { getSessionProfile, createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/utils/roles";
import { toggleUserAutoBooking } from "@/lib/actions/auto-booking";
import { getProfilesByIds } from "@/lib/supabase/auto-booking";

interface PageProps {
  searchParams: Promise<{ search?: string; sort?: string; order?: string }>;
}

export default async function AutoBookingPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const searchTerm = (searchParams.search || "").toLowerCase().trim();
  const sortBy = (searchParams.sort || "nome") as string;
  const sortOrder = (searchParams.order || "asc") as "asc" | "desc";

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
    // Use admin client to bypass RLS and read all profiles
    const adminClient = createAdminClient();
    const dbClient = adminClient || supabase; // Fallback to regular client if admin key not configured

    // Get all profiles from database
    const { data: allProfiles, error: profilesError } = await dbClient
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (profilesError) {
      error = `Errore lettura profili: ${profilesError.message}`;
    } else if (allProfiles && allProfiles.length > 0) {
      const profileMap = new Map(allProfiles.map((p: any) => [p.id, p]));

      // Get emails from auth API if admin client is available
      const emailMap = new Map<string, string>();
      if (adminClient) {
        try {
          const { data: authUsers } = await adminClient.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          for (const u of authUsers?.users ?? []) {
            emailMap.set(u.id, u.email ?? "—");
          }
        } catch (e) {
          // Silently fail - will fallback to ID display
        }
      }

      // Get auto-booking status for all users
      const { data: statuses, error: statusError } = await dbClient
        .from("user_auto_booking_enabled")
        .select("user_id, auto_booking_enabled");

      if (statusError) {
        error = `Errore lettura auto-booking: ${statusError.message}`;
      } else {
        const statusMap = new Map(
          (statuses || []).map((s: any) => [s.user_id, s.auto_booking_enabled])
        );

        // Get slot counts per user
        const { data: slotData, error: slotError } = await dbClient
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
            email: emailMap.get(prof.id) || prof.id.slice(0, 8) + "...",
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

          // Sort by column
          users.sort((a: any, b: any) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
              case "email":
                aVal = a.email.toLowerCase();
                bVal = b.email.toLowerCase();
                break;
              case "nome":
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
              case "slot":
                aVal = a.slotCount;
                bVal = b.slotCount;
                break;
              case "autobooking":
                aVal = a.enabled ? 1 : 0;
                bVal = b.enabled ? 1 : 0;
                break;
              default:
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            }

            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
          });
        }
      }
    } else if (allProfiles?.length === 0) {
      // No users found, but no error
      users = [];
    }
  } catch (e: any) {
    error = `Errore server: ${e?.message || "Errore sconosciuto"}`;
  }

  // Helper function to generate sort URL
  const getSortUrl = (column: string) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    params.set("sort", column);
    params.set("order", newOrder);
    return `/sys/auto-booking?${params.toString()}`;
  };

  // Helper to render sortable header
  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    const isActive = sortBy === column;
    const arrow = isActive ? (sortOrder === "asc" ? " ↑" : " ↓") : " ⇅";
    return (
      <a
        href={getSortUrl(column)}
        className={`cursor-pointer hover:text-navy-700 font-semibold ${isActive ? "text-navy-700" : ""}`}
      >
        {label}
        {arrow}
      </a>
    );
  };

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
              <th className="px-6 py-3 text-left text-sm text-gray-700">
                <SortableHeader column="email" label="Email" />
              </th>
              <th className="px-6 py-3 text-left text-sm text-gray-700">
                <SortableHeader column="nome" label="Nome" />
              </th>
              <th className="px-6 py-3 text-center text-sm text-gray-700">
                <SortableHeader column="slot" label="Slot Abilitati" />
              </th>
              <th className="px-6 py-3 text-center text-sm text-gray-700">
                <SortableHeader column="autobooking" label="Auto-Booking" />
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
