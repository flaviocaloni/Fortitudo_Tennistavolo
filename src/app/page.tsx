import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function Home() {
  const { user } = await getSessionProfile();
  if (user) redirect("/calendario");

  return (
    <div className="mx-auto mt-16 max-w-lg text-center">
      <h1 className="text-3xl font-bold">🏓 Tennistavolo</h1>
      <p className="mt-3 text-slate-600">
        Prenota i tuoi allenamenti di ping pong: calendario settimanale, slot
        per agonisti e amatori, eventi speciali.
      </p>
      <Link href="/login" className="btn-primary mt-6">
        Accedi o registrati
      </Link>
    </div>
  );
}
