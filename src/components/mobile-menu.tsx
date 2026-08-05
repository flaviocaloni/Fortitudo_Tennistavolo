"use client";

import { useState } from "react";
import Link from "next/link";

export interface NavLink {
  href: string;
  label: string;
  highlight?: boolean;
}

/** Menu a scomparsa per mobile: bottone ☰ a sinistra del logo. */
export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label="Apri menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-white/30 text-xl text-white hover:bg-navy-700"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          {/* sfondo cliccabile per chiudere */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed left-0 top-0 z-50 h-full w-64 bg-navy-800 p-4 shadow-xl">
            <button
              aria-label="Chiudi menu"
              onClick={() => setOpen(false)}
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-white/30 text-xl text-white hover:bg-navy-700"
            >
              ✕
            </button>
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-base ${
                    l.highlight
                      ? "font-semibold text-amber-400 hover:bg-navy-700"
                      : "text-white hover:bg-navy-700"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
