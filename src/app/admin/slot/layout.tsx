import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/roles";

export default async function SlotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) redirect("/calendario");

  const sections = [
    { href: "/admin/slot/nuovo", label: "➕ Nuovo slot" },
    { href: "/admin/slot/ricorrenti", label: "🔄 Ricorrenti" },
    { href: "/admin/slot/eventi", label: "📅 Eventi" },
    { href: "/admin/slot/chiusure", label: "🚫 Chiusure" },
    { href: "/admin/slot/visibilita", label: "👁️ Visibilità" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="text-sm font-medium text-slate-700 hover:text-navy-700 hover:underline"
          >
            {section.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
