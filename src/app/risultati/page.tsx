import Link from "next/link";
import AthleteSearch from "@/components/athlete-search";

export const metadata = {
  title: "Risultati Atleti | Fortitudo Tennistavolo",
  description: "Ricerca atleti nella classifica regionale lombarda",
};

export default function RisultatiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* MAIN CONTENT */}
        <AthleteSearch />

        {/* FOOTER INFO */}
        <div className="mt-16 rounded-lg bg-white p-6 border border-slate-200">
          <h2 className="mb-3 font-semibold text-slate-900">ℹ️ Informazioni</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              ✅ I dati provengono dalla classifica regionale lombarda ufficiale FITET
            </li>
            <li>
              📅 Ultimo aggiornamento: 27 settembre 2026
            </li>
            <li>
              🔗 Clicca su "Dettagli Completi" per accedere al portale FITET con informazioni complete
            </li>
            <li>
              🏓 Per risultati di altre regioni,{" "}
              <a
                href="https://portale.fitet.org/risultati/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                visita il portale FITET
              </a>
            </li>
          </ul>
        </div>

        {/* BACK LINK */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
