"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * Pulsante di eliminazione partita con dialog popup + checkbox di conferma.
 * Usato dentro <form action={deleteMatch}>
 */
export default function ConfirmDeleteMatchButton({
  message = "Eliminare questa partita?",
  className = "text-red-600 hover:underline",
  children = "Elimina",
}: {
  message?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowDialog(true);
  };

  const handleConfirm = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isChecked) {
      setShowDialog(false);
      setIsChecked(false);
      (e.currentTarget.form as HTMLFormElement).requestSubmit(e.currentTarget);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setIsChecked(false);
  };

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {children}
      </button>

      {/* DIALOG */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {message}
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                ⚠️ Questa azione non può essere annullata. Tutte le presenze associate verranno eliminate.
              </p>
            </div>

            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 rounded border border-gray-300 cursor-pointer"
              />
              <label
                htmlFor="confirm-delete"
                className="ml-3 text-sm text-gray-700 cursor-pointer"
              >
                Sì, elimina questa partita
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!isChecked}
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition ${
                  isChecked
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
