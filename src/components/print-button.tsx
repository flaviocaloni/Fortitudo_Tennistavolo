"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn">
      Salva in PDF / Stampa
    </button>
  );
}
