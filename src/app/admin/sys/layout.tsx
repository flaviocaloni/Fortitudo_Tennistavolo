import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/utils/roles";

export default async function SysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (!profile || !isSuperAdmin(profile.role)) redirect("/admin");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 text-sm">
        <span className="font-bold text-red-700">🔧 System Admin</span>
        <Link href="/admin/sys" className="hover:text-navy-700">Dashboard</Link>
        <Link href="/admin/sys/auto-booking" className="hover:text-navy-700">🤖 Auto-Booking</Link>
      </div>
      {children}
    </div>
  );
}
