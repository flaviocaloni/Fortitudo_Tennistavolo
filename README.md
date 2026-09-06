# Fortitudo Tennistavolo — Booking & Campionato 🏓

**Piattaforma completa di prenotazione allenamenti e gestione campionati** per il club Fortitudo Busnago Tennistavolo.

**Versione 1.0.0** — Stabile e Produzione Ready  
**Tech Stack:** Next.js 16 (App Router) · Supabase (PostgreSQL + Auth) · Tailwind CSS · Vercel  
**Produzione:** https://fortitudo-tennistavolo.vercel.app

---

## 📋 Sommario

1. [Funzionalità](#funzionalità)
2. [Ruoli e Accesso](#ruoli-e-accesso)
3. [Setup Locale](#setup-locale)
4. [Deploy Produzione](#deploy-produzione)
5. [Struttura Progetto](#struttura-progetto)
6. [In Sviluppo](#in-sviluppo)
7. [Problemi Noti](#problemi-noti)

---

## Funzionalità

### 🗓️ Gestione Stagioni e Slot

- **Stagioni**: Contenitori annuali per slot e prenotazioni con date inizio/fine
  - Una sola stagione "corrente" attiva per volta
  - Calendario mostra solo le date della stagione corrente
  - Gestione in `/admin/stagioni`

- **Slot Ricorrenti**: Allenamenti settimanali ripetuti (es: Lunedì 19:00–20:30)
  - Capienza massima per slot
  - Limite settimanale per ruolo (es: agonisti max 2/settimana)
  - Modifica/disattivazione affronta solo istanze future

- **Slot Extra/Eventi**: Singoli slot non ricorrenti (es: torneo, lezione)

- **Chiusure del Centro**: Date quando la struttura non è disponibile (indipendenti da stagione)

### 👤 Autenticazione e Profili

- **Email + Password**: Registrazione self-service
- **Ruoli:**
  - **Agonista**: Giocatore agonista (federato FITET)
  - **Amatore**: Giocatore ricreativo
  - **Admin**: Gestire utenti, stagioni, slot, prenotazioni, certificati
  - **Superadmin**: Accesso completo + gestione feature sistema

- **Profilo Utente:**
  - Dati base (nome, email, telefono)
  - Certificato medico: data scadenza + stato badge (valido/in scadenza/scaduto) ✏️ Admin only
  - Tessera FITET: numero + data aggiornamento ✏️ Admin only
  - Squadra assegnata ✏️ Admin only

### 📅 Calendario e Prenotazioni

- **Calendario Intuitivo:**
  - Vista mensile/settimanale
  - Solo slot della stagione corrente
  - Indicatori capacità (verde pieno, giallo quasi pieno, rosso pieno)
  - Badge "Prenotato" per proprie prenotazioni

- **Prenotazione:**
  - Click-to-book con conferma
  - Vincoli validati a livello database:
    - Capienza massima
    - Ruolo compatibile
    - Limite settimanale personalizzato per profilo
  - Non modificabili nel passato da amatori/agonisti (solo admin)

- **Overbooking (Waiting List):**
  - Slot pieno: possibilità di iscriversi in lista d'attesa
  - Auto-promozione quando si libera un posto
  - Storico tracking per audit

- **Visualizzazione Prenotazioni:**
  - Scheda "Prossime" (ordinate per data)
  - Storico filtrato per stagione
  - Dettagli: data, ora, capienza, luogo, note

### 🏆 Campionati e Classifica

- **Gestione Campionati** (admin-only):
  - Crea campionati per stagione
  - Organizzazione per serie e girone
  - Stato: programmato, in corso, concluso

- **Squadre di Campionato:**
  - Assegnazione giocatori (agonisti) a squadre
  - Solo giocatori con status "active"
  - Possibilità di disattivare squadra

- **Partite:**
  - Creazione: squadra, avversario, data/ora, tipo (singola/andata/ritorno), sede (casa/trasferta)
  - Campi opzionali: società avversaria, luogo, indirizzo, note
  - Sorteraggio per data, squadra, tipo, stato
  - Stati: Programmata, Completata, Annullata, Rinviata

- **Gestione Partite (Match Details):**
  - **Modifica Partita**: Campo separato per modifica dati (non risultato)
  - **Modifica Risultato**: Score per squadra (0–7), validazione: somma deve essere 7
  - **Gestione Presenze**: Presente/Assente per ogni giocatore
  - **Scoring Automatico:**
    - 7, 6, 5: 3 punti
    - 4: 2 punti
    - 3: 1 punto
    - 2, 1, 0: 0 punti

- **Classifica:**
  - Tabella squadre: posizione, partite, vittorie, sconfitte, punti
  - Tabella risultati: data, squadra, risultato, avversario, punti assegnati
  - Calcolo automatico tramite RPC al salvataggio risultato

- **Presenze Campionato:**
  - Gestione semplificata: presente/assente per giocatore
  - Toggle admin per modifica
  - Default "presente" per giocatori squadra

### 📊 Statistiche e Report

- **Statistiche Personali** (`/statistiche`):
  - Prenotazioni totali
  - Cancellazioni
  - Partecipazione per periodo
  - Filtro per stagione

- **Statistiche Amministrative** (`/admin/statistiche`):
  - Andamento prenotazioni nel tempo (grafico)
  - Riepilogo per utente (filtri multipli: ruolo, squadra, stato)
  - Report certificati medici (scaduti, in scadenza, validi)
  - Export dati (opzionale)

### 🔐 Gestione Utenti (Admin)

- **Ricerca e Drill-Down** (`/admin/utenti`):
  - Ricerca per nome/email
  - Filtro per ruolo
  - Mostra: stato account, certificato, tessera FITET, squadra

- **Azioni:**
  - Modifica profilo (nome, telefono, tessera, certificato, squadra)
  - Disattiva/riattiva accesso (account rimane, storico preservato)
  - Eliminazione definitiva (con conferma checkbox)

- **Audit Log:** Traccia completa di creazioni, modifiche, cancellazioni

### 📧 Notifiche (Parziale)

- **In Sviluppo:** Email notifications per:
  - Conferma prenotazione
  - Reminder 24h prima partita
  - Cambio presenze campionato
  - Promozione dalla waiting list

**Status:** Infrastruttura pronta, invio email non ancora attivo.

---

## Ruoli e Accesso

| Funzione | Agonista | Amatore | Admin | Superadmin |
|----------|----------|---------|-------|-----------|
| Prenotare slot | ✅ | ✅ | ✅ | ✅ |
| Visualizzare calendario | ✅ | ✅ | ✅ | ✅ |
| Modificare prenotazioni passate | ❌ | ❌ | ✅ | ✅ |
| Gestire stagioni/slot | ❌ | ❌ | ✅ | ✅ |
| Gestire campionati | ❌ | ❌ | ✅ | ✅ |
| Gestire utenti | ❌ | ❌ | ✅ | ✅ |
| Gestire admin (feature system) | ❌ | ❌ | ❌ | ✅ |
| Visualizzare statistiche proprie | ✅ | ✅ | ✅ | ✅ |
| Visualizzare statistiche sistema | ❌ | ❌ | ✅ | ✅ |

---

## Setup Locale

### Prerequisiti
- Node.js 18+
- npm o yarn
- Account Supabase gratuito (supabase.com)

### Passo 1: Creare Progetto Supabase

1. Vai a [supabase.com](https://supabase.com) e crea nuovo progetto
2. Annota **Project URL** e **Anon Key**

### Passo 2: Eseguire Migrazioni

1. Accedi al Supabase Dashboard → **SQL Editor**
2. Per ogni file in `supabase/migrations/` (in ordine: 0001 → 0037):
   - Copia il contenuto del file
   - Incolla in SQL Editor
   - Clicca **Run**
3. ⚠️ Ordine è importante! Una sola migration per volta.

### Passo 3: Configurare Authentication

1. Supabase Dashboard → **Authentication → Providers**
2. **Email**: abilita (default)

### Passo 4: Configurare Variabili d'Ambiente

```bash
# Copia template
cp .env.example .env.local

# Compila i valori:
NEXT_PUBLIC_SUPABASE_URL=https://kzlnxnfwwfgqmqcvdyox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-da-supabase>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-da-supabase>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Passo 5: Installare e Avviare

```bash
npm install
npm run dev
```

App disponibile su `http://localhost:3000`

### Passo 6: Creare Admin Iniziale

1. Registra primo utente (es: tuoindirizzo@email.com)
2. **SQL Editor** → esegui:

```sql
UPDATE public.profiles 
SET role = 'superadmin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'tuoindirizzo@email.com'
);
```

✅ Primo login accede a `/admin`

---

## Deploy Produzione

### Requisiti
- Repository GitHub
- Account Vercel (gratuito)

### Configurazione

1. **GitHub:**
   - Push repo a GitHub (branch `main`)
   - `.env.local` nel `.gitignore` (non committare!)

2. **Vercel:**
   - Accedi a [vercel.com](https://vercel.com)
   - "New Project" → importa repo GitHub
   - Configura Environment Variables (stessi valori di `.env.local`):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_SITE_URL=https://tuo-dominio.vercel.app`

3. **Deploy Automatico:**
   - Ogni push a `main` → build e deploy automatico su Vercel

### Migrazioni in Produzione

⚠️ **Le migrazioni SQL non vengono eseguite automaticamente!**

Dopo ogni modifica DB (nuove migrazioni):
1. Accedi a Supabase Dashboard (progetto produzione)
2. SQL Editor → esegui la nuova migration

---

## Struttura Progetto

```
tennistavolo-booking/
├── .env.example                       # Template variabili ambiente
├── .env.local                         # ⚠️ Credenziali locali (gitignored)
├── supabase/
│   ├── migrations/                    # SQL 0001–0037 (ordine importante)
│   └── config.toml                    # CLI config Supabase
├── src/
│   ├── middleware.ts                  # Route protection middleware
│   ├── app/
│   │   ├── layout.tsx                 # Layout principale + navbar
│   │   ├── login/                     # Auth (login + registrazione)
│   │   ├── calendario/                # Calendario prenotazioni
│   │   ├── prenotazioni/              # Le mie prenotazioni + storico
│   │   ├── profilo/                   # Profilo utente
│   │   ├── statistiche/               # Statistiche personali
│   │   ├── campionato/                # Vista pubblica campionato/classifica
│   │   │   ├── [id]/squadre/          # Visualizza squadre
│   │   │   ├── [id]/classifica/       # Visualizza classifica
│   │   │   └── [id]/calendario/       # Visualizza partite
│   │   └── admin/                     # Sezione amministrativa
│   │       ├── stagioni/              # CRUD stagioni
│   │       ├── slot/                  # CRUD slot ricorrenti e extra
│   │       ├── prenotazioni/          # Gestisci tutte prenotazioni
│   │       ├── utenti/                # Gestisci utenti
│   │       ├── campionato/            # CRUD campionati
│   │       │   └── [id]/
│   │       │       ├── squadre/       # Squadre e giocatori
│   │       │       ├── partite/       # Crea/modifica partite
│   │       │       └── classifica/    # Visualizza classifica
│   │       └── statistiche/           # Report amministrativo
│   ├── components/                    # React components riusabili
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── admin-*.tsx                # Componenti admin specifici
│   │   └── ...
│   └── lib/
│       ├── supabase/
│       │   ├── server.ts              # Client server-side
│       │   ├── admin.ts               # Admin client (service role)
│       │   ├── client.ts              # Client browser-side
│       │   ├── middleware.ts          # Middleware utilities
│       │   ├── bookings.ts            # Query prenotazioni
│       │   ├── championships.ts       # Query campionati
│       │   ├── users.ts               # Query utenti
│       │   └── ...
│       ├── actions/                   # Server Actions (form handlers)
│       │   ├── auth.ts                # Login/registrazione
│       │   ├── bookings.ts            # Crea/modifica/cancella prenotazioni
│       │   ├── users.ts               # Modifica utenti
│       │   ├── seasons.ts             # Gestisci stagioni
│       │   ├── slots.ts               # Gestisci slot
│       │   ├── championships.ts       # Gestisci campionati/partite
│       │   └── ...
│       ├── utils/
│       │   ├── roles.ts               # Controllo ruoli
│       │   ├── dates.ts               # Utility date
│       │   ├── types.ts               # Type definitions
│       │   └── settings.ts            # Impostazioni globali
│       └── hooks/                     # Custom React hooks
├── public/                            # Static assets
├── next.config.mjs                    # Next.js configuration
└── package.json

```

---

## In Sviluppo

### 📧 Email Notifications

**Status:** Infrastruttura pronta, invio non attivo

Sono stato implementato il sistema di notifiche base:
- Database tables per preferenze notifiche utente
- API endpoint per trigger invio
- Templates email

Prossimi passi:
- Integrazione provider email (SendGrid, AWS SES, Resend)
- Implementazione cron job per reminder automatici
- UI per preferenze notifiche

**Trigger pianificati:**
- Conferma prenotazione
- Reminder 24h prima allenamento
- Reminder cambio presenze campionato
- Promozione automatica waiting list

---

## Problemi Noti

- **Impersonificazione utente ("Accedi come"):**
  - Temporaneamente disabilitata frontend
  - Backend funzionante ma non integrato
  - Vedi [TODO_IMPERSONIFICAZIONE.md](TODO_IMPERSONIFICAZIONE.md) per dettagli

---

## Limite Free Tier

| Servizio | Limite | Utilizzo Tipico |
|----------|--------|-----------------|
| **Vercel** | 100 GB bandwidth/mese | ~1-2 GB/mese club |
| **Supabase** | 500 MB database | Ampiamente sufficiente |
| **Supabase Auth** | 50.000 active users/mese | ~50-100 utenti |

Upgrade richiesto solo se: DB > 500 MB oppure > 50k login/mese (molto improbabile).

---

## Support & Issues

Per bug, feature request, o domande:
1. Controlla [Issues GitHub](https://github.com/flaviocaloni/Fortitudo_Tennistavolo/issues)
2. Crea nuovo issue con dettagli (versione, step da riprodurre, screenshot)
3. Tag label: `bug`, `feature`, `question`, `documentation`

---

## License

Progetto privato per Fortitudo Busnago Tennistavolo. Tutti i diritti riservati © 2026.

---

**Ultima aggiornamento:** 2026-09-06  
**Versione:** 1.0.0 Stable
