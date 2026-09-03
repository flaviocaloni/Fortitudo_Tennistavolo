"use client";

import type { ReactNode } from "react";

/**
 * Pulsante di submit con dialog di conferma.
 * Client Component: può essere usato dentro un <form action={serverAction}>
 * renderizzato da un Server Component, dove gli event handler inline
 * (onClick/onSubmit) non sono ammessi.
 */
export default function ConfirmDeleteButton({
  message = "Confermi l'eliminazione?",
  className = "text-red-600 hover:underline",
  children = "Elimina",
}: {
  message?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
