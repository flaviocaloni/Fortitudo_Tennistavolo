import Link from "next/link";
import AthleteSearch from "@/components/athlete-search";

export const metadata = {
  title: "Classifica FITET | Fortitudo Tennistavolo",
  description: "Ricerca atleti nella classifica regionale lombarda FITET",
};

export default function RisultatiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* BETA BANNER */}
        <div className="mb-6 rounded-lg bg-amber-100 border border-amber-300 px-4 py-2 text-center">
          <span className="inline-block rounded-full bg-amber-500 text-white text-xs font-bold px-2 py-1 mr-2">BETA</span>
          <span className="text-sm text-amber-900">Ricerca live dal portale FITET - Feedback benvenuti!</span>
        </div>

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
              🔗 Clicca su "Dettagli Completi" per accedere alla classifica completa sul portale FITET
            </li>
            <li>
              🏓 Per altre regioni: {" "}
              <a
                href="https://portale.fitet.org/risultati/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Visita Portale FITET
              </a>
              {" "} | {" "}
              <a
                href="https://portale.fitet.org/risultati/new_rank/testaclassifica_comit.php?ID_CLASS=247&ID=1&PASS=20&COMIT=4"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Classifica Lombarda
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
