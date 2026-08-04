import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/bookings";

export default async function Navbar() {
  const { profile } = await getSessionProfile();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-700">
          🏓 Tennistavolo
        </Link>
        {profile ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/calendario" className="hover:text-emerald-700">
              Calendario
            </Link>
            <Link href="/prenotazioni" className="hover:text-emerald-700">
              Le mie prenotazioni
            </Link>
            <Link href="/statistiche" className="hover:text-emerald-700">
              Statistiche
            </Link>
            {profile.role === "admin" && (
              <Link href="/admin" className="font-semibold text-amber-700 hover:text-amber-800">
                Admin
              </Link>
            )}
            <span className="hidden text-slate-500 sm:inline">
              {profile.full_name} ({profile.role})
            </span>
            <form action={signOut}>
              <button className="btn-ghost">Esci</button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn-primary">
            Accedi
          </Link>
        )}
      </nav>
    </header>
  );
}
