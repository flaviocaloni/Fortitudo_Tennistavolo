import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Analytics } from "@vercel/analytics/react";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  title: "Fortitudo Busnago Tennistavolo — Prenotazioni",
  description: "Prenota gli allenamenti della Fortitudo Busnago Tennistavolo",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <Analytics />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}