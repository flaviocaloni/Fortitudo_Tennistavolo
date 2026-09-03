import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/bookings";
import { stopImpersonating } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import MobileMenu, { type NavLink } from "@/components/mobile-menu";

export default async function Navbar() {
  const { profile } = await getSessionProfile();
  const cookieStore = await cookies();
  const impersonatingUserId = cookieStore.get("impersonating")?.value;

  // Se impersonifichiamo, leggi il nome dell'utente
  let impersonatedName = "";
  if (impersonatingUserId && profile?.role === "admin") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", impersonatingUserId)
      .single();
    impersonatedName = data?.full_name ?? "Utente";
  }

  const links: NavLink[] = profile
    ? [
        { href: "/calendario", label: "Calendario" },
        { href: "/prenotazioni", label: "Le mie prenotazioni" },
        { href: "/campionato", label: "Campionato" },
        { href: "/statistiche", label: "Statistiche" },
        ...(profile.role === "admin"
          ? [{ href: "/admin", label: "Admin", highlight: true }]
          : []),
        { href: "/profilo", label: "👤 Il mio profilo" },
      ]
    : [];

  return (
    <header>
      {impersonatingUserId && profile?.role === "admin" && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
          📌 Stai visualizzando come <b>{impersonatedName}</b>
          <form action={stopImpersonating} className="mt-1">
            <button className="text-amber-700 underline hover:text-amber-900">
              Torna ad admin
            </button>
          </form>
        </div>
      )}
      <nav className="border-b-4 border-crimson-600 bg-navy-800 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-3">
          {profile && <MobileMenu links={links} />}
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
        </div>

        {profile ? (
          <div className="flex items-center gap-4 text-sm">
            {/* link estesi: solo da tablet in su */}
            <div className="hidden items-center gap-4 md:flex">
              <Link href="/calendario" className="hover:text-crimson-500">
                Calendario
              </Link>
              <Link href="/prenotazioni" className="hover:text-crimson-500">
                Le mie prenotazioni
              </Link>
              <Link href="/campionato" className="hover:text-crimson-500">
                Campionato
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
              <Link
                href="/profilo"
                title="Il mio profilo"
                className="text-navy-200 underline-offset-2 hover:text-white hover:underline"
              >
                👤 {profile.full_name}
              </Link>
            </div>
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
        </div>
      </nav>
    </header>
  );
}
