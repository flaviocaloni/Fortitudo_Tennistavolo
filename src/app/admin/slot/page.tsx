import Link from "next/link";

export default function SlotOverview() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Gestione slot</h1>
      <p className="mb-6 text-slate-600">
        Organizza gli slot ricorrenti, gli eventi speciali, le chiusure del centro e le impostazioni del calendario.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/slot/nuovo"
          className="card block transition-all hover:border-navy-400 hover:shadow-md"
        >
          <h2 className="font-semibold text-navy-800">➕ Nuovo slot</h2>
          <p className="text-sm text-slate-600">Crea un nuovo slot ricorrente o evento</p>
        </Link>

        <Link
          href="/admin/slot/ricorrenti"
          className="card block transition-all hover:border-navy-400 hover:shadow-md"
        >
          <h2 className="font-semibold text-navy-800">🔄 Slot ricorrenti</h2>
          <p className="text-sm text-slate-600">Gestisci gli allenamenti settimanali</p>
        </Link>

        <Link
          href="/admin/slot/eventi"
          className="card block transition-all hover:border-navy-400 hover:shadow-md"
        >
          <h2 className="font-semibold text-navy-800">📅 Slot extra / eventi</h2>
          <p className="text-sm text-slate-600">Gestisci gli eventi speciali con filtri e clonazione</p>
        </Link>

        <Link
          href="/admin/slot/chiusure"
          className="card block transition-all hover:border-navy-400 hover:shadow-md"
        >
          <h2 className="font-semibold text-navy-800">🚫 Chiusure del centro</h2>
          <p className="text-sm text-slate-600">Definisci i periodi di chiusura</p>
        </Link>

        <Link
          href="/admin/slot/visibilita"
          className="card block transition-all hover:border-navy-400 hover:shadow-md"
        >
          <h2 className="font-semibold text-navy-800">👁️ Visibilità calendario</h2>
          <p className="text-sm text-slate-600">Configura i giorni visibili in anticipo</p>
        </Link>
      </div>
    </div>
  );
}
