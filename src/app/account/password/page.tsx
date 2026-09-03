"use client";

import { useState } from "react";
import { useRouter } from "next/redirect";
import { createClient } from "@/lib/supabase/client";

/** Pagina di destinazione del link "reset password":
 *  l'utente arriva già autenticato dal link email e sceglie la nuova password. */
export default function PasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      return setError("Le password non coincidono");
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);

    router.push("/calendario");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card">
        <h1 className="mb-3 text-xl font-bold text-navy-800">
          Imposta nuova password
        </h1>
        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Nuova password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="input"
            />
          </div>
          <div>
            <label className="label">Conferma password</label>
            <input
              name="confirm"
              type="password"
              required
              minLength={6}
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Attendere…" : "Salva password"}
          </button>
        </form>
      </div>
    </div>
  );
}
