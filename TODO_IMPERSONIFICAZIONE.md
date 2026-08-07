# TODO: Impersonificazione utente

**Stato:** disabilitata lato frontend dal 7/8/2026 (release 0).

## Problema

La funzionalità "Accedi come" (impersonificazione admin di un utente) non
funziona correttamente. Segnalato dall'utente il 7/8/2026, non ancora
diagnosticato nel dettaglio.

## Cosa è stato fatto

- Rimosso il bottone "👁️ Accedi come" da `src/components/admin-users-list-client.tsx`
  (import e form commentati/rimossi).
- **Non toccato** il backend: `impersonateUser` e `stopImpersonating` in
  `src/lib/actions/auth.ts` restano invariati.
- **Non toccato** il banner "Stai visualizzando come..." in
  `src/components/navbar.tsx` — resta dead code innocuo (si attiva solo se
  il cookie `impersonating` è presente, e ora nessuna UI può settarlo).

## Da fare per riabilitare

1. Diagnosticare perché l'impersonificazione non funziona (verificare
   `impersonateUser` in `src/lib/actions/auth.ts`: imposta un cookie
   `impersonating` con `user_id`, ma **nessun codice lo utilizza per
   sostituire effettivamente la sessione/i dati mostrati** — probabile
   causa: il cookie viene solo letto dalla navbar per mostrare il banner,
   ma le pagine (`/calendario`, `/prenotazioni`, ecc.) continuano a
   interrogare Supabase con la sessione reale dell'admin, non
   dell'utente impersonato).
2. Decidere l'approccio corretto: es. usare l'admin client per generare
   un magic link/sessione per l'utente target, oppure filtrare le query
   lato server in base al cookie `impersonating` quando l'utente
   corrente è admin.
3. Ripristinare il bottone in `admin-users-list-client.tsx` una volta
   risolto.
4. Rimuovere questo file una volta chiuso.
