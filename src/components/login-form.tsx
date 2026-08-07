"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginWithEmail } from "@/lib/actions/auth";

export default function LoginForm({
  googleOAuthEnabled,
  loginError,
}: {
  googleOAuthEnabled: boolean;
  loginError?: string;
}) {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(loginError ?? null);

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

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card">
        <h1 className="mb-4 text-center text-xl font-bold text-navy-800">Accedi</h1>

        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <form action={loginWithEmail} className="space-y-3">
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

          <button type="submit" className="btn-primary w-full">
            Accedi
          </button>
        </form>

        <p className="mt-3 text-center text-xs">
          <Link
            href="/account/reset-password"
            className="text-navy-700 hover:underline"
          >
            Password dimenticata?
          </Link>
        </p>

        {googleOAuthEnabled && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              oppure
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button onClick={handleGoogle} className="btn-ghost w-full">
              Continua con Google
            </button>
          </>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
          Non hai un account? Contatta il club per la registrazione.
        </p>
      </div>
    </div>
  );
}
