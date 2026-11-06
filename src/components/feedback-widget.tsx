"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { submitFeedback } from "@/lib/actions/feedback";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const reset = () => {
    setRating(null);
    setNote("");
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (rating === null) {
      setMessage({ type: "error", text: "Scegli pollice su o giù" });
      return;
    }
    setSending(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("rating", String(rating));
    formData.append("note", note);
    formData.append("page_path", pathname);
    const result = await submitFeedback(formData);
    setSending(false);

    if (result.ok) {
      setMessage({ type: "ok", text: "Grazie, feedback ricevuto!" });
      setRating(null);
      setNote("");
    } else {
      setMessage({ type: "error", text: result.error ?? "Errore, riprova" });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Lascia un feedback</h2>
            <button
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="text-slate-500 hover:text-slate-800"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          <p className="mb-2 text-xs text-slate-500">Com&apos;è stata questa pagina?</p>
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setRating(1)}
              className={`flex-1 rounded-lg border px-3 py-2 text-lg ${
                rating === 1 ? "border-green-600 bg-green-50" : "border-slate-300 hover:bg-slate-50"
              }`}
              aria-pressed={rating === 1}
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => setRating(-1)}
              className={`flex-1 rounded-lg border px-3 py-2 text-lg ${
                rating === -1 ? "border-red-600 bg-red-50" : "border-slate-300 hover:bg-slate-50"
              }`}
              aria-pressed={rating === -1}
            >
              👎
            </button>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Cosa non va o cosa vorresti? (facoltativo)"
            className="input mb-2 w-full text-sm"
          />

          {message && (
            <p className={`mb-2 text-sm ${message.type === "ok" ? "text-green-700" : "text-red-700"}`}>
              {message.text}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Link href="/feedback" className="text-xs text-blue-700 underline" onClick={() => setOpen(false)}>
              I miei feedback
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="btn-navy text-sm disabled:opacity-60"
            >
              {sending ? "Invio..." : "Invia"}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-800 text-xl text-white shadow-lg hover:bg-navy-700"
        aria-label="Feedback"
        title="Lascia un feedback"
      >
        💬
      </button>
    </div>
  );
}
