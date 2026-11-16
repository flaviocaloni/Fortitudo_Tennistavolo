# Analisi performance: caricamento, salvataggi e refresh

Stato: analisi basata sul codice (non misurata). Pagine più visitate (Vercel Analytics): /calendario-pubblico (475), /login (464), /calendario (412), /campionato (96), /campionato/convocazioni (96), /admin (65), /campionato/[id]/le-mie-partite (40).

## Cosa rallenta

Per un utente loggato, /calendario-pubblico esegue circa 11 round trip seriali verso Supabase prima del render dei dati:

1. `src/lib/supabase/middleware.ts`: `auth.getUser()` su ogni navigazione.
2. `src/app/layout.tsx`: `getSessionProfile()` + `getFeedbackSettings()`.
3. `src/components/navbar.tsx`: `getSessionProfile()` di nuovo.
4. `src/app/calendario-pubblico/page.tsx`: `getSessionProfile()` ancora, poi `getCurrentSeason()` e `getCalendarVisibility()` in sequenza.
5. Solo dopo, il blocco parallelo (slot, occupazione, chiusure, partite).

Cause principali: `getSessionProfile` non memoizzata; pagine `force-dynamic`; nessuna `regions` in `vercel.json` (funzioni nella regione di default, lontana da Supabase se in Europa).

## Proposte

| # | Intervento | File | Effetto stimato | Rischio | Stato |
|---|---|---|---|---|---|
| P1 | Memoizzare `getSessionProfile` con `cache()` di React | `src/lib/supabase/server.ts` | 6 → 2 chiamate per richiesta | Basso | Implementata |
| P2 | `Promise.all` per stagione e visibilità; unire le query `app_settings` | `calendario-pubblico/page.tsx`, `layout.tsx`, `lib/settings.ts`, `lib/feedback.ts` | −3 chiamate seriali | Basso | Da fare |
| P3 | Regione Vercel vicina a Supabase (es. `fra1`) | `vercel.json` | ~100 ms → ~25 ms per chiamata | Basso; serve la regione del progetto Supabase | In attesa dell'informazione |
| P4 | Cache dati pubblici con `unstable_cache` + tag invalidati dalle azioni admin | `lib/settings.ts`, `lib/supabase/championship-calendar.ts`, azioni admin | −3/4 chiamate per richiesta | Medio: dati vecchi se un tag non viene invalidato | Da valutare dopo P1-P3 |
| P5 | Notifiche in `bookSlot` con `after()` di `next/server` | `src/lib/actions/bookings.ts` | Nessun effetto sul tempo di risposta; notifiche affidabili su Vercel | Basso | Da fare |
| P6 | Rimuovere `console.log` nel percorso caldo | vari | Trascurabile; log più puliti | Nullo | Da fare |

## Stima d'impatto (ipotesi, non misurata)

Ipotesi: ~100 ms per chiamata da Washington a Supabase in Europa, ~25 ms con regione vicina.

- Caricamento /calendario-pubblico: da ~11 chiamate seriali (~1,1 s) a ~4-5 (~0,45 s) con P1+P2; con P3 sotto ~0,15 s.
- Salvataggio prenotazione e refresh: stessa riduzione, perché il redirect ricarica la catena completa.

## Da verificare

- 464 visite a /login contro 412 a /calendario: possibili sessioni che scadono spesso o redirect ripetuti. Controllare durata JWT in Supabase (Auth → Settings).
- Matcher del middleware: verificare che escluda asset statici e prefetch.
- Regione del progetto Supabase (Settings → General) per decidere P3.

## Ordine proposto

1. P1 (fatto) e P2.
2. P3 dopo conferma della regione Supabase.
3. P5 e P6.
4. P4 solo se il caricamento resta sopra ~0,5 s dopo 1-3.
