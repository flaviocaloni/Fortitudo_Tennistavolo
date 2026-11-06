import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { updateFeedbackSettings } from "@/lib/actions/feedback";
import { getFeedbackSettings } from "@/lib/feedback";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function FeedbackConfigPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase } = await getSessionProfile();
  const settings = await getFeedbackSettings(supabase);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/feedback" className="mb-4 inline-block text-sm text-blue-700 hover:underline">
        ← Torna ai feedback
      </Link>
      <h1 className="mb-2 text-2xl font-bold">Configurazione feedback</h1>
      <p className="mb-6 text-slate-600">
        Il pulsante 💬 compare agli utenti loggati solo se il feedback è attivo.
      </p>

      <ErrorBanner message={params.error} />
      {params.success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Configurazione salvata.
        </div>
      )}

      <form action={updateFeedbackSettings} className="card flex flex-col gap-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mt-1 h-4 w-4" />
          <span>
            <span className="block font-semibold text-slate-800">Feedback attivo</span>
            <span className="block text-sm text-slate-600">
              Se disattivato, il pulsante scompare dalle pagine e non si accettano nuovi feedback.
              I feedback già ricevuti restano consultabili dal pannello admin.
            </span>
          </span>
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="label mb-1">Notifiche Telegram</legend>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="telegram" value="OFF" defaultChecked={settings.telegram === "OFF"} className="mt-1" />
            <span>
              <span className="block font-semibold text-slate-800">Disattivate</span>
              <span className="block text-sm text-slate-600">Nessun messaggio su Telegram per i nuovi feedback.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="telegram" value="NEGATIVE" defaultChecked={settings.telegram === "NEGATIVE"} className="mt-1" />
            <span>
              <span className="block font-semibold text-slate-800">Solo pollici giù (consigliata)</span>
              <span className="block text-sm text-slate-600">Notifica solo i feedback negativi, che sono quelli che richiedono attenzione.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="telegram" value="ALL" defaultChecked={settings.telegram === "ALL"} className="mt-1" />
            <span>
              <span className="block font-semibold text-slate-800">Tutti i feedback</span>
              <span className="block text-sm text-slate-600">Notifica ogni feedback. Con molti utenti può diventare rumoroso.</span>
            </span>
          </label>
        </fieldset>

        <p className="text-xs text-slate-500">
          Il messaggio Telegram contiene pagina, voto e testo della nota, ma non il nome dell&apos;utente (solo un codice breve).
        </p>

        <button className="btn-navy w-fit">Salva configurazione</button>
      </form>
    </div>
  );
}
