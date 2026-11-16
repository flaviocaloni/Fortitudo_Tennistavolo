---
name: test-pagine-ruoli
description: Checklist di test manuali e automatici per verificare ogni pagina di Fortitudo Tennistavolo con i 4 profili (amatore, agonista, admin, superadmin). Usare quando si chiede di testare l'app, verificare un rilascio o controllare accessi per ruolo.
---

# Test pagine per ruolo — Fortitudo Tennistavolo

## Profili

| Ruolo | Accesso atteso |
|---|---|
| `amatore` | Calendario, prenotazioni personali, profilo, FAQ, feedback, risultati. Nessuna area `/admin` o `/sys`. |
| `agonista` | Come amatore + pagine campionato (classifica, calendario, le mie partite, convocazioni). |
| `admin` | Come agonista + area `/admin/*`. Nessuna `/sys`. |
| `superadmin` | Tutto, incluse `/sys/*` e gestione utenti con ruoli admin/superadmin. |

Guardie di accesso (da verificare se cambiano):
- `src/app/admin/layout.tsx`: senza `isAdmin` → redirect `/calendario`.
- `src/app/sys/layout.tsx`: senza `isSuperAdmin` → redirect `/calendario`.

Account di test: usare solo utenti di test (es. `TestAdmin` per superadmin). Non usare credenziali reali. Non recuperare o condividere password.

## Procedura

1. Per ogni ruolo, fare login con l'account di test.
2. Per ogni pagina della tabella, aprire l'URL e annotare: **accesso** (ok / redirect / errore), **contenuto** (dati visibili, nessun errore console), **azione principale** (vedi colonna).
3. Confrontare con l'atteso. Un redirect su pagina non consentita è **ok**; un contenuto visibile a ruolo non autorizzato è **bug critico**.
4. Verificare la console del browser (nessun errore rosso) e che il server non logghi errori (`preview_logs` / Vercel logs).

Legenda esito: ✅ ok · ⚠️ dubbio/da confermare · ❌ bug.

## Pubbliche (nessun login richiesto)

| URL | Atteso | Azione da provare |
|---|---|---|
| `/login` | Form visibile; login valido porta a `/calendario` | Login con credenziali errate → messaggio d'errore, nessun crash |
| `/privacy`, `/termini` | Testo visibile | — |
| `/risultati` | Risultati visibili | — |
| `/calendario-pubblico` | Calendario visibile anche da anonimo (se la visibilità lo consente) | Cambio settimana/navigazione date |
| `/calendario-pubblico/campionato/[date]` | Partite della data | Data senza partite → stato vuoto |
| `/account/reset-password` | Form reset | Email non valida → errore gestito |

## Comuni (tutti i 4 ruoli)

| URL | Atteso amatore | agonista | admin | superadmin | Azione da provare |
|---|---|---|---|---|---|
| `/calendario` | ✅ | ✅ | ✅ | ✅ | Prenotare uno slot libero; lo slot compare in "Le mie prenotazioni" |
| `/calendario/auto-booking` | ✅ se abilitato | ✅ | ✅ | ✅ | Attivare/disattivare auto-booking; etichette giorni corrette (domenica = indice 0) |
| `/prenotazioni` | ✅ | ✅ | ✅ | ✅ | Annullare una prenotazione propria |
| `/profilo` | ✅ | ✅ | ✅ | ✅ | Modificare nome/telefono; salvataggio conferma e persiste dopo refresh |
| `/account/password` | ✅ | ✅ | ✅ | ✅ | Cambio password con vecchia errata → errore |
| `/faq` | ✅ | ✅ | ✅ | ✅ | Testo aggiornato (riserve R1/R2 citate) |
| `/feedback` | ✅ | ✅ | ✅ | ✅ | Invio feedback → conferma; visibile in admin |
| `/statistiche` | ⚠️ da confermare | ⚠️ | ✅ | ✅ | Grafici caricano senza errori |

## Campionato (agonista, admin, superadmin; amatore da confermare)

| URL | Atteso amatore | agonista | admin | superadmin | Azione da provare |
|---|---|---|---|---|---|
| `/campionato` | ⚠️ | ✅ | ✅ | ✅ | Elenco campionati |
| `/campionato/convocazioni` | ⚠️ | ✅ | ✅ | ✅ | Riepilogo partite; righe **Riserva 1** e **Riserva 2** visibili quando presenti |
| `/campionato/[id]/calendario` | ⚠️ | ✅ | ✅ | ✅ | Filtri/date |
| `/campionato/[id]/squadre` | ⚠️ | ✅ | ✅ | ✅ | Elenco squadre |
| `/campionato/[id]/squadra/[teamId]` | ⚠️ | ✅ | ✅ | ✅ | Rosa e statistiche squadra |
| `/campionato/[id]/classifica` | ⚠️ | ✅ | ✅ | ✅ | Classifica coerente con i risultati |
| `/campionato/[id]/partita/[matchId]` | ⚠️ | ✅ | ✅ | ✅ | Dettaglio partita, formazione (lettere A/B/C e riserve) |
| `/campionato/[id]/le-mie-partite` | ❌ | ✅ | ✅ | ✅ | Solo partite della propria squadra |

## Area admin (admin, superadmin; amatore/agonista → redirect `/calendario`)

| URL | Atteso | Azione da provare |
|---|---|---|
| `/admin` | Dashboard admin | Link alle sottosezioni funzionanti |
| `/admin/prenotazioni` | Lista prenotazioni | Filtro per data; annullamento |
| `/admin/slot` | Gestione slot | Nuovo slot, modifica |
| `/admin/slot/nuovo` | Form creazione | Creazione slot con campi obbligatori; errore se vuoti |
| `/admin/slot/ricorrenti` | Slot ricorrenti | Creazione/modifica ricorrenza |
| `/admin/slot/eventi` | Eventi | Creazione evento; clone da `/admin/slot/eventi/[id]/clone` |
| `/admin/slot/pizza` | Eventi pizza | Creazione; clone da `/admin/slot/pizza/[id]/clone` |
| `/admin/slot/chiusure` | Chiusure centro | Creazione chiusura; prenotazioni in quel giorno bloccate |
| `/admin/slot/visibilita` | Visibilità calendario | Cambio visibilità, effetto su `/calendario-pubblico` |
| `/admin/stagioni` | Stagioni | Stagione corrente |
| `/admin/utenti` | Gestione utenti | Creazione utente (solo superadmin può assegnare admin/superadmin); attiva/disattiva accesso con label corretta |
| `/admin/notifiche` | Notifiche | Invio/stato |
| `/admin/feedback` | Feedback ricevuti | Cambio stato/categoria; stato persiste dopo salvataggio |
| `/admin/feedback/configurazione` | Configurazione feedback | Salvataggio impostazioni |
| `/admin/statistiche` (+ `/prenotazioni`, `/booking-chart`, `/pizza`, `/certificati`, `/convocazioni`) | Grafici | Caricamento senza errori |
| `/admin/campionato` | Elenco campionati | Creazione/selezione |
| `/admin/campionato/[id]` | Dettaglio campionato | — |
| `/admin/campionato/[id]/squadre` e `/squadre/[teamId]` | Gestione squadre | Modifica squadra |
| `/admin/campionato/[id]/partite` | Partite | Elenco e filtri |
| `/admin/campionato/[id]/partite/[matchId]` | Dettaglio partita | Lettera: A, B, C, **Riserva 1**, **Riserva 2**; salvataggio formazione; riepilogo mostra riserve |
| `/admin/campionato/[id]/partite/formazioni` | Formazioni | Assegnazione giocatori |
| `/admin/campionato/[id]/partite/import-export` | Import/export | Export CSV; import file valido e non valido |
| `/admin/campionato/[id]/classifica` | Classifica | Coerenza con risultati |
| `/admin/campionato-notifiche` | Notifiche campionato | Invio test |

## Area sistema (solo superadmin; altri → redirect `/calendario`)

| URL | Atteso | Azione da provare |
|---|---|---|
| `/sys` | Pannello sistema | Navigazione; voce "Calendario Avanzato" assente dalla navbar |
| `/sys/auto-booking` | Esecuzione manuale auto-booking | Pulsante "Esegui ora" → riquadro risultati (utenti, create, già presenti, fallite, errori) |
| `/sys/google-oauth` | Stato OAuth | Solo lettura, nessuna modifica di prova |

## Overbooking e regole di prenotazione (da provare con tutti e 4 i ruoli)

1. Slot pieno → amatore/agonista: messaggio "Slot al completo"; admin/superadmin: pulsante "Prenota in overbooking" disponibile.
2. Giorno di chiusura (es. ponte) → nessun ruolo può prenotare; l'auto-booking non crea prenotazioni.
3. Limite settimanale rispettato per amatore/agonista.

## Navbar per ruolo

- amatore/agonista: nessuna voce admin o sys.
- admin: voci admin, nessuna sys.
- superadmin: voci admin e sys; nessuna voce "Calendario Avanzato".

## Output richiesto

Restituire una tabella con: pagina · ruolo · esito (✅/⚠️/❌) · dettaglio se ❌ (URL, messaggio, screenshot o log). Elencare separatamente i ⚠️ da confermare con l'utente.
