# Tennistavolo Booking 🏓

App di prenotazione allenamenti per il club Fortitudo Busnago Tennistavolo.
**Next.js 16 (App Router) · Supabase (Postgres + Auth) · Tailwind CSS · Vercel**

**Release 0 — 7/8/2026** (consolidamento della prima versione funzionante in produzione)

Produzione: https://fortitudo-tennistavolo.vercel.app

## Funzionalità

- **Stagioni**: contenitore per slot e prenotazioni, con date inizio/fine e stagione "corrente"; il calendario mostra solo le date della stagione attiva. Gestione in `/admin/stagioni`.
- **Slot ricorrenti settimanali** e **slot extra/eventi**, associati a una stagione; disattivazione/modifica incide solo sulla generazione futura del calendario.
- **Chiusure del centro** indipendenti dalla stagione.
- **Registrazione** con profilo **Agonista / Amatore** (mai admin) e limite settimanale (1–3), modificabile solo dall'admin.
- **Certificato medico**: data di scadenza per utente, badge di stato (valido/in scadenza/scaduto), editabile solo dall'admin; visibile in sola lettura nel profilo utente.
- **Tessera FITET**: numero tessera per gli agonisti, editabile solo dall'admin, visibile in sola lettura nel profilo.
- **Gestione utenti admin**: ricerca, drill-down per ruolo, disattivazione/riattivazione accesso (senza perdere dati storicizzati), eliminazione definitiva con conferma via checkbox.
- **Prenotazioni** con vincoli a livello di database: capienza massima, ruolo compatibile, limite settimanale; non modificabili nel passato da amatori/agonisti (solo l'admin può agire su prenotazioni passate).
- **Statistiche personali** e **statistiche amministrative** (andamento prenotazioni per periodo, riepilogo per utente filtrabile/ordinabile, report certificati medici), filtrabili per stagione.
- **Storico e audit log** completo (creazioni, cancellazioni, interventi admin).

## Problemi noti

- **Impersonificazione utente** ("Accedi come"): temporaneamente disabilitata lato frontend, non funzionante. Vedi [TODO_IMPERSONIFICAZIONE.md](TODO_IMPERSONIFICAZIONE.md).

## Struttura del progetto

```
tennistavolo-booking/
├── .env.example
├── supabase/migrations/               # 0001 → 0013, applicate manualmente in ordine nel SQL Editor Supabase
├── src/
│   ├── proxy.ts                       # Middleware: redirect a /login per rotte protette
│   ├── app/
│   │   ├── login/page.tsx             # Login (server action) + registrazione
│   │   ├── calendario/page.tsx        # Calendario vincolato alla stagione corrente
│   │   ├── prenotazioni/page.tsx      # Prossime (ordinate) + storico on-demand
│   │   ├── profilo/page.tsx           # Dati account, certificato medico, tessera FITET
│   │   ├── statistiche/page.tsx       # Statistiche personali, filtro stagione
│   │   └── admin/
│   │       ├── stagioni/page.tsx      # Crea/modifica/imposta stagione corrente
│   │       ├── slot/page.tsx          # CRUD slot, chiusure centro
│   │       ├── prenotazioni/page.tsx  # Tutte le prenotazioni, filtri multipli
│   │       ├── utenti/page.tsx        # Ricerca, drill-down, disattiva/elimina utenti
│   │       └── statistiche/page.tsx   # Andamento, riepilogo utenti, certificati
│   ├── components/                    # navbar, admin-*-client, season-filter, ecc.
│   └── lib/
│       ├── supabase/                  # client browser / server / admin (service role) / middleware
│       ├── actions/                   # Server Actions: auth, bookings, admin, users, seasons, profile
│       └── dates.ts / types.ts / settings.ts
```

## Setup locale

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. SQL Editor → esegui **in ordine** tutte le migrazioni in `supabase/migrations/` (0001 → 0013).
3. Authentication → Providers: abilita **Email**; opzionale **Google** OAuth.
4. Copia `.env.example` in `.env.local` con URL, anon/publishable key e (per le funzioni admin) service role/secret key.
5. Installa e avvia:
   ```
   npm install
   npm run dev
   ```
6. Registra il primo utente, poi promuovilo ad admin dal SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'tua@email.it');
   ```

## Deploy su Vercel

Repo GitHub collegato a Vercel (branch `main` → produzione automatica). Variabili
d'ambiente da configurare nel progetto Vercel: le stesse di `.env.local`.
Dopo ogni modifica alle migrazioni, applicarle manualmente nel SQL Editor di
Supabase — non vengono eseguite automaticamente dal deploy.

## Note sui limiti free tier

- **Vercel Hobby**: 100 GB banda/mese — ampiamente sufficiente per un club.
- **Supabase Free**: 500 MB database, 50.000 utenti attivi mensili di Auth.
