import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import ErrorBanner from "@/components/error-banner";
import { replyToFeedback, updateFeedback } from "@/lib/actions/feedback";
import {
  FEEDBACK_CATEGORY_LABEL,
  FEEDBACK_STATUS_LABEL,
  UNEXPECTED_THRESHOLD,
  looksLikeBug,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";

interface Reply {
  id: string;
  body: string;
  created_at: string;
}

interface AdminFeedback {
  id: string;
  created_at: string;
  user_id: string;
  page_path: string;
  rating: number;
  note: string | null;
  status: FeedbackStatus;
  category: FeedbackCategory | null;
  admin_note: string | null;
  feedback_replies: Reply[];
}

interface PageProps {
  searchParams: Promise<{ status?: string; rating?: string; category?: string; page?: string; error?: string }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase } = await getSessionProfile();

  const { data } = await supabase
    .from("feedback")
    .select("id, created_at, user_id, page_path, rating, note, status, category, admin_note, feedback_replies(id, body, created_at)")
    .order("created_at", { ascending: false })
    .limit(500);

  const all = (data ?? []) as unknown as AdminFeedback[];
  const weekAgo = Date.now() - 7 * DAY_MS;

  const negativeLastWeekByPage = new Map<string, number>();
  for (const item of all) {
    if (item.rating === -1 && new Date(item.created_at).getTime() >= weekAgo) {
      negativeLastWeekByPage.set(item.page_path, (negativeLastWeekByPage.get(item.page_path) ?? 0) + 1);
    }
  }

  const highlightOf = (item: AdminFeedback): string | null => {
    if (item.rating !== -1) return null;
    if ((negativeLastWeekByPage.get(item.page_path) ?? 0) >= UNEXPECTED_THRESHOLD) return "Risultato inatteso";
    if (looksLikeBug(item.note)) return "Bug probabile";
    return null;
  };

  const items = all.filter((item) => {
    if (params.status && item.status !== params.status) return false;
    if (params.rating && String(item.rating) !== params.rating) return false;
    if (params.category && item.category !== params.category) return false;
    if (params.page && !item.page_path.includes(params.page)) return false;
    return true;
  });

  const counts = {
    total: all.length,
    negative: all.filter((i) => i.rating === -1).length,
    toReview: all.filter((i) => i.status === "NEW").length,
    highlighted: all.filter((i) => highlightOf(i) !== null).length,
  };

  const selectClass = "rounded-lg border border-slate-300 px-2 py-1 text-sm";

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">💬 Feedback utenti</h1>
          <p className="text-sm text-slate-600">
            Ultimi 500 feedback. Le evidenziazioni sono calcolate automaticamente, la classificazione finale è tua.
          </p>
        </div>
        <Link href="/admin/feedback/configurazione" className="btn-navy text-sm">
          ⚙️ Configurazione
        </Link>
      </div>

      <ErrorBanner message={params.error} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card"><p className="text-xs text-slate-500">Totale</p><p className="text-2xl font-bold">{counts.total}</p></div>
        <div className="card"><p className="text-xs text-slate-500">Pollici giù</p><p className="text-2xl font-bold">{counts.negative}</p></div>
        <div className="card"><p className="text-xs text-slate-500">Da vedere</p><p className="text-2xl font-bold">{counts.toReview}</p></div>
        <div className="card border-l-4 border-red-500"><p className="text-xs text-slate-500">Evidenziati</p><p className="text-2xl font-bold">{counts.highlighted}</p></div>
      </div>

      <form method="get" className="card mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-slate-600">
          Stato
          <select name="status" defaultValue={params.status ?? ""} className={selectClass}>
            <option value="">Tutti</option>
            {Object.entries(FEEDBACK_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          Voto
          <select name="rating" defaultValue={params.rating ?? ""} className={selectClass}>
            <option value="">Tutti</option>
            <option value="1">👍</option>
            <option value="-1">👎</option>
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          Categoria
          <select name="category" defaultValue={params.category ?? ""} className={selectClass}>
            <option value="">Tutte</option>
            {Object.entries(FEEDBACK_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          Pagina contiene
          <input name="page" defaultValue={params.page ?? ""} className={selectClass} placeholder="/campionato" />
        </label>
        <button className="btn-navy text-sm">Filtra</button>
      </form>

      {items.length === 0 ? (
        <div className="card text-sm text-slate-600">Nessun feedback con questi filtri.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const highlight = highlightOf(item);
            return (
              <div key={item.id} className={`card ${highlight ? "border-l-4 border-red-500" : ""}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{new Date(item.created_at).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}</span>
                  <span>· <code>{item.page_path}</code></span>
                  <span>· {item.rating === 1 ? "👍" : "👎"}</span>
                  <span>· utente #{item.user_id.slice(0, 8)}</span>
                  {highlight && (
                    <span className="rounded bg-red-100 px-2 py-0.5 font-semibold text-red-700">{highlight}</span>
                  )}
                  <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    {FEEDBACK_STATUS_LABEL[item.status]}
                  </span>
                </div>

                {item.note && <p className="whitespace-pre-wrap text-sm text-slate-800">{item.note}</p>}

                <form action={updateFeedback} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
                  <input type="hidden" name="feedback_id" value={item.id} />
                  <label className="flex flex-col text-xs text-slate-600">
                    Stato
                    <select name="status" defaultValue={item.status} className={selectClass}>
                      {Object.entries(FEEDBACK_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col text-xs text-slate-600">
                    Categoria
                    <select name="category" defaultValue={item.category ?? ""} className={selectClass}>
                      <option value="">Da classificare</option>
                      {Object.entries(FEEDBACK_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className="flex min-w-[200px] flex-1 flex-col text-xs text-slate-600">
                    Nota interna
                    <input name="admin_note" defaultValue={item.admin_note ?? ""} className={selectClass} />
                  </label>
                  <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800">Salva</button>
                </form>

                {item.feedback_replies.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {item.feedback_replies
                      .slice()
                      .sort((a, b) => a.created_at.localeCompare(b.created_at))
                      .map((reply) => (
                        <div key={reply.id} className="rounded-lg bg-navy-50 p-2 text-sm text-slate-800">
                          <p className="whitespace-pre-wrap">{reply.body}</p>
                        </div>
                      ))}
                  </div>
                )}

                <form action={replyToFeedback} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="feedback_id" value={item.id} />
                  <textarea
                    name="body"
                    rows={2}
                    maxLength={1000}
                    required
                    placeholder="Risposta all'utente (visibile in 'I miei feedback')"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button className="btn-navy w-fit text-sm">Rispondi</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
