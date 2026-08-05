import Link from "next/link";
import { sendPasswordResetEmail } from "@/lib/actions/auth";
import ErrorBanner from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="mb-4 text-2xl font-bold">Reimposta password</h1>
        <p className="mb-4 text-sm text-slate-600">
          Inserisci l&apos;email del tuo account e ti invieremo un link per resettare
          la password.
        </p>

        <ErrorBanner message={searchParams.error} />
        {searchParams.sent && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            ✓ Email inviata. Controlla la tua casella postale (e la cartella spam).
          </div>
        )}

        <form action={sendPasswordResetEmail} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              placeholder="flavio@example.com"
              required
              className="input"
            />
          </div>
          <button className="btn-primary w-full">Invia link di reset</button>
        </form>

        <p className="mt-4 text-center text-sm">
          Ricordi la password?{" "}
          <Link href="/login" className="text-navy-700 hover:underline">
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}
