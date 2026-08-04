# Tennistavolo Booking 🏓

App di prenotazione allenamenti di ping pong — stack 100% gratuito:
**Next.js 14 (App Router) · Supabase (Postgres + Auth) · Tailwind CSS · Vercel Hobby**

## Funzionalità

- **Slot ricorrenti settimanali** configurabili dall'admin (giorno, orario, destinatari, capienza min/max)
- **Slot extra / eventi** una tantum con data specifica
- **Registrazione** con scelta profilo **Agonista / Amatore** (mai admin) e **limite di prenotazioni settimanali (1–3)**, modificabile solo dall'admin
- **Prenotazioni** con vincoli applicati a livello di database: capienza massima, ruolo compatibile con lo slot, limite settimanale
- **Login** Google OAuth o email/password (Supabase Auth)
- **Statistiche personali** (settimana / mese / anno + andamento mensile) e **riepilogo per utente riservato all'admin**
- **Storico e audit log** completo (creazioni, cancellazioni, interventi admin)

## Struttura del progetto

```
tennistavolo-booking/
├── .env.example
├── supabase/migrations/0001_init.sql   # Schema: tabelle, trigger, RLS, funzione occupazione
├── src/
│   ├── middleware.ts                   # Redirect a /login per rotte protette
│   ├── app/
│   │   ├── layout.tsx / page.tsx / globals.css
│   │   ├── login/page.tsx              # Login + registrazione (ruolo & limite settimanale)
│   │   ├── auth/callback/route.ts      # Callback OAuth
│   │   ├── calendario/page.tsx         # Calendario 14 giorni, prenota/cancella
│   │   ├── prenotazioni/page.tsx       # Prossime + storico personale
│   │   ├── statistiche/page.tsx        # Statistiche personali + riepilogo admin
│   │   └── admin/
│   │       ├── layout.tsx              # Guard: solo admin
│   │       ├── page.tsx                # Dashboard + log attività
│   │       ├── slot/page.tsx           # CRUD slot ricorrenti ed eventi
│   │       ├── prenotazioni/page.tsx   # Tutte le prenotazioni, cancellazione admin
│   │       └── utenti/page.tsx         # Ruoli e limiti settimanali
│   ├── components/                     # navbar, error-banner, admin/slot-form
│   └── lib/
│       ├── supabase/                   # client browser / server / middleware
│       ├── actions/                    # Server Actions: bookings, admin
│       ├── dates.ts / types.ts
```

## Setup locale

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. SQL Editor → incolla ed esegui `supabase/migrations/0001_init.sql`.
3. Authentication → Providers: abilita **Email**; per **Google** crea le credenziali OAuth (gratuite) su [Google Cloud Console](https://console.cloud.google.com) (tipo "Web application", redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`) e incolla Client ID/Secret in Supabase.
4. Copia `.env.example` in `.env.local` e inserisci URL e anon key (Project Settings → API).
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

## Deploy gratuito su Vercel

1. Crea un repo GitHub e fai push del progetto:
   ```
   git init && git add -A && git commit -m "Tennistavolo booking app"
   git remote add origin https://github.com/<utente>/tennistavolo-booking.git
   git push -u origin main
   ```
2. Su [vercel.com](https://vercel.com) → **Add New → Project** → importa il repo (piano Hobby, gratuito).
3. In *Environment Variables* aggiungi le variabili di `.env.example` (URL e anon key bastano).
4. Deploy. Poi in Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://<app>.vercel.app`
   - **Redirect URLs**: aggiungi `https://<app>.vercel.app/auth/callback`
5. Se usi Google OAuth, aggiungi il dominio Vercel agli *Authorized JavaScript origins* in Google Cloud Console.

## Note sui limiti free tier

- **Vercel Hobby**: 100 GB banda/mese, serverless illimitate per uso hobbistico — ampiamente sufficiente per un club.
- **Supabase Free**: 500 MB database, 50.000 utenti attivi mensili di Auth. Il progetto viene messo in pausa dopo 7 giorni di inattività: basta riattivarlo dal dashboard (o una visita periodica lo tiene attivo).
