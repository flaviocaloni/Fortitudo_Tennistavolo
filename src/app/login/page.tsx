"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/calendario");
      router.refresh();
    } else {
      // Registrazione: ruolo (agonista/amatore) e limite settimanale (1-3)
      // finiscono nei metadata e vengono letti dal trigger handle_new_user.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: String(form.get("full_name")),
            role: String(form.get("role")),
            weekly_limit: String(form.get("weekly_limit")),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      setInfo(
        "Registrazione inviata! Controlla la tua email per confermare l'account."
      );
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card">
        <div className="mb-4 flex gap-2">
          <button
            className={mode === "login" ? "btn-primary flex-1" : "btn-ghost flex-1"}
            onClick={() => setMode("login")}
          >
            Accedi
          </button>
          <button
            className={mode === "register" ? "btn-primary flex-1" : "btn-ghost flex-1"}
            onClick={() => setMode("register")}
          >
            Registrati
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {info}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="label">Nome e cognome</label>
              <input name="full_name" required className="input" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="input"
            />
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="label">Profilo</label>
                <select name="role" className="input" defaultValue="amatore">
                  <option value="amatore">Amatore</option>
                  <option value="agonista">Agonista</option>
                </select>
              </div>
              <div>
                <label className="label">
                  Prenotazioni settimanali desiderate
                </label>
                <select name="weekly_limit" className="input" defaultValue="1">
                  <option value="1">1 a settimana</option>
                  <option value="2">2 a settimana</option>
                  <option value="3">3 a settimana</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Modificabile in seguito solo dall&apos;amministratore.
                </p>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? "Attendere…"
              : mode === "login"
                ? "Accedi"
                : "Crea account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          oppure
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button onClick={handleGoogle} className="btn-ghost w-full">
          Continua con Google
        </button>
        {mode === "register" && (
          <p className="mt-2 text-xs text-slate-500">
            Registrandoti con Google entri come <b>amatore</b> con 1
            prenotazione a settimana: l&apos;amministratore potrà poi
            aggiornare profilo e limite.
          </p>
        )}
      </div>
    </div>
  );
}
