import { redirect } from "next/redirect";
import Link from "next/link";
import Image from "next/image";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function Home() {
  const { user } = await getSessionProfile();
  if (user) redirect("/calendario");

  return (
    <div className="mx-auto mt-12 max-w-lg text-center">
      <Image
        src="/logo.jpg"
        alt="Fortitudo Busnago Tennistavolo"
        width={180}
        height={180}
        className="mx-auto rounded-2xl shadow-lg"
        priority
      />
      <h1 className="mt-6 text-3xl font-bold text-navy-800">
        Fortitudo Busnago
        <span className="block text-crimson-600">Tennistavolo</span>
      </h1>
      <p className="mt-3 text-slate-600">
        Prenota i tuoi allenamenti: calendario settimanale, slot per agonisti
        e amatori, eventi speciali.
      </p>
      <Link href="/login" className="btn-primary mt-6">
        Accedi o registrati
      </Link>
    </div>
  );
}
