import Link from "next/link";

export default function AdminDashboard() {
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
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Amministrazione</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card block transition-all hover:border-navy-400 hover:shadow-md"
          >
            <h2 className="mb-2 font-semibold text-navy-800">{section.title}</h2>
            <p className="text-sm text-slate-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
