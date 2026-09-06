import Link from "next/link";

export default function SysDashboard() {
  const sections = [
    {
      href: "/admin/sys/auto-booking",
      title: "🤖 Auto-Booking",
      description: "Gestisci la feature auto-booking degli utenti",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">System Admin</h1>
      <p className="mb-6 text-sm text-slate-600">
        Area riservata al superadmin per gestioni di sistema avanzate.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section: any) => (
          <Link
            key={section.href}
            href={section.href}
            className="card block transition-all hover:border-navy-400 hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <h2 className="font-semibold text-navy-800">{section.title}</h2>
            </div>
            <p className="text-sm text-slate-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
