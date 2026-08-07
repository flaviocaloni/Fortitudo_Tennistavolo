import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/calendario");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 text-sm">
        <span className="font-bold text-amber-700">Area Admin</span>
        <Link href="/admin" className="hover:text-navy-700">Dashboard</Link>
        <Link href="/admin/slot" className="hover:text-navy-700">Slot</Link>
        <Link href="/admin/prenotazioni" className="hover:text-navy-700">Prenotazioni</Link>
        <Link href="/admin/utenti" className="hover:text-navy-700">Utenti</Link>
        <Link href="/admin/statistiche" className="hover:text-navy-700">Statistiche</Link>
      </div>
      {children}
    </div>
  );
}
