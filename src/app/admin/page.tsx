import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { isAdmin, isSuperAdmin } from "@/lib/utils/roles";

export default async function AdminDashboard() {
  const { profile } = await getSessionProfile();

  if (!profile || !isAdmin(profile.role)) {
    redirect("/calendario");
  }

  const sections = [
    {
      href: "/admin/stagioni",
      title: "🗓️ Stagioni",
      description: "Crea e gestisci le stagioni",
    },
    {
      href: "/admin/slot",
      title: "📅 Slot",
      description: "Gestisci gli slot di allenamento",
    },
    {
      href: "/admin/prenotazioni",
      title: "📋 Prenotazioni",
      description: "Visualizza e gestisci le prenotazioni",
    },
    {
      href: "/admin/utenti",
      title: "👥 Utenti",
      description: "Gestisci profili e permessi utenti",
    },
    {
      href: "/admin/statistiche",
      title: "📊 Statistiche",
      description: "Report e analisi avanzate",
    },
    {
      href: "/admin/campionato",
      title: "🏆 Campionato",
      description: "Gestisci campionati, squadre e partite",
      badge: "Beta",
    },
    {
      href: "/admin/notifiche",
      title: "📧 Notifiche",
      description: "Configura notifiche email per eventi",
      badge: "Beta",
    },
    ...(isSuperAdmin(profile?.role)
      ? [
          {
            href: "/admin/sys/auto-booking",
            title: "🤖 Auto-Booking",
            description: "Gestisci la feature auto-booking degli utenti",
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Amministrazione</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section: any) => (
          <Link
            key={section.href}
            href={section.href}
            className="card block transition-all hover:border-navy-400 hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <h2 className="font-semibold text-navy-800">{section.title}</h2>
              {section.badge && (
                <span className="badge bg-amber-100 text-amber-800 text-xs">{section.badge}</span>
              )}
            </div>
            <p className="text-sm text-slate-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
