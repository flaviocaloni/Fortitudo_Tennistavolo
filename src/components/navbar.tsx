import Link from "next/link";
import Image from "next/image";
import { getSessionProfile } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/bookings";

export default async function Navbar() {
  const { profile } = await getSessionProfile();

  return (
    <header className="border-b-4 border-crimson-600 bg-navy-800 text-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Fortitudo Busnago Tennistavolo"
            width={44}
            height={44}
            className="rounded-full border-2 border-white/70"
          />
          <span className="text-lg font-bold leading-tight">
            Fortitudo <span className="text-crimson-500">Tennistavolo</span>
          </span>
        </Link>
        {profile ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/calendario" className="hover:text-crimson-500">
              Calendario
            </Link>
            <Link href="/prenotazioni" className="hover:text-crimson-500">
              Le mie prenotazioni
            </Link>
            <Link href="/statistiche" className="hover:text-crimson-500">
              Statistiche
            </Link>
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className="font-semibold text-amber-400 hover:text-amber-300"
              >
                Admin
              </Link>
            )}
            <span className="hidden text-navy-200 sm:inline">
              {profile.full_name} ({profile.role})
            </span>
            <form action={signOut}>
              <button className="btn border border-white/40 text-white hover:bg-navy-700">
                Esci
              </button>
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
