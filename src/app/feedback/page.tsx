import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import {
  FEEDBACK_CATEGORY_LABEL,
  FEEDBACK_STATUS_LABEL,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";

interface Reply {
  id: string;
  body: string;
  created_at: string;
}

interface OwnFeedback {
  id: string;
  created_at: string;
  page_path: string;
  rating: number;
  note: string | null;
  status: FeedbackStatus;
  category: FeedbackCategory | null;
  feedback_replies: Reply[];
}

export default async function MyFeedbackPage() {
  const { supabase, user } = await getSessionProfile();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("feedback")
    .select("id, created_at, page_path, rating, note, status, category, feedback_replies(id, body, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (data ?? []) as unknown as OwnFeedback[];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">💬 I miei feedback</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        Qui trovi i feedback che hai inviato e le risposte della società.
      </p>

      {items.length === 0 ? (
        <div className="card text-sm text-slate-600">
          Non hai ancora inviato feedback. Usa il pulsante 💬 in basso a destra su qualsiasi pagina.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{new Date(item.created_at).toLocaleDateString("it-IT")}</span>
                <span>· {item.page_path}</span>
                <span>· {item.rating === 1 ? "👍" : "👎"}</span>
                <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {FEEDBACK_STATUS_LABEL[item.status]}
                </span>
              </div>

              {item.note && <p className="text-sm text-slate-800">{item.note}</p>}

              {item.feedback_replies.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                  {item.feedback_replies
                    .slice()
                    .sort((a, b) => a.created_at.localeCompare(b.created_at))
                    .map((reply) => (
                      <div key={reply.id} className="rounded-lg bg-navy-50 p-3 text-sm text-slate-800">
                        <p className="mb-1 text-xs font-semibold text-navy-700">Risposta della società</p>
                        <p className="whitespace-pre-wrap">{reply.body}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-3 border-t pt-3 text-xs text-slate-500">Nessuna risposta ancora.</p>
              )}

              {item.category && (
                <p className="mt-2 text-xs text-slate-400">Categoria: {FEEDBACK_CATEGORY_LABEL[item.category]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
