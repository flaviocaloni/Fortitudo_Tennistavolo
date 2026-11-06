import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Analytics } from "@vercel/analytics/react";
import { getSessionProfile } from "@/lib/supabase/server";
import { getFeedbackSettings } from "@/lib/feedback";
import FeedbackWidget from "@/components/feedback-widget";

export const metadata: Metadata = {
  title: "Fortitudo Busnago Tennistavolo — Prenotazioni",
  description: "Prenota gli allenamenti della Fortitudo Busnago Tennistavolo",
  icons: { icon: "/logo.jpg" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile } = await getSessionProfile();
  const feedback = profile ? await getFeedbackSettings(supabase) : null;

  return (
    <html lang="it">
      <body>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        {feedback?.enabled && <FeedbackWidget />}
        <footer className="mt-12 bg-slate-900 px-4 py-5 text-center text-sm text-slate-200">
          <a
            href="https://ttfortitudobusnago.blogspot.com/p/catalogo-materiale-tennistavolo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-400 hover:text-amber-300 underline"
          >
            Shop
          </a>
          <p className="mt-1">Acquista i tuoi materiali per giocare e allenarti al meglio!</p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}