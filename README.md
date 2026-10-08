# 🎾 Fortitudo Tennistavolo — Booking & Management App

**App web per la gestione di prenotazioni slot allenamenti, campionati e partecipanti della società di tennistavolo Fortitudo.**

- 🌐 **Live:** https://fortitudo-tennistavolo.vercel.app
- 📦 **Versione:** v1.2.0 (2026-10-08)
- 🔧 **Stack:** Next.js 16 + Supabase + Vercel

---

## 📋 Indice

1. [Features](#features)
2. [Architettura](#architettura)
3. [Setup e Installazione](#setup-e-installazione)
4. [Struttura Progetto](#struttura-progetto)
5. [Database e Migrazioni](#database-e-migrazioni)
6. [Moduli Principali](#moduli-principali)
7. [Deploy](#deploy)
8. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 📅 Prenotazioni Allenamenti
- **Slot ricorrenti:** Creazione slot con frequenza settimanale/bisettimanale
- **Limite settimanale:** Max 2 slot prenotabili per settimana (solo training slot)
- **Selected Participants:** Indicazione del numero di partecipanti per prenotazione
- **Calendario pubblico:** Vista pubblica con filtri per data/ruolo/istruttore
- **Admin panel:** Gestione completa slot (create, update, delete)

### 🍕 Slot Pizza
- **Slot speciali:** Pizza slots senza limite settimanale
- **Contatore partecipanti:** Mostra numero totale partecipanti per slot
- **Statistiche admin:** Filtri per slot con visualizzazione prenotazioni

### 🏆 Campionato
- **Gestione partite:** Creazione e update match con date/orari/venue
- **Presenze:** Sistema di registrazione presenze (PRESENT/ABSENT) con notifiche
- **Notifiche:** Email (Gmail OAuth) + Telegram per cambiamenti presenze
- **Calendario:** Vista dedicata per il campionato con filtri per squadra/data
- **Attendance history:** Logging di tutti i cambiamenti di presenze

### 👥 Sistema di Ruoli
- **Admin:** Accesso completo a tutte le features
- **Agonista:** Giocatore agonista — visualizza campionato e prenotazioni
- **Amatore:** Giocatore amatore — accesso limitato, no campionato

---

## 🏗️ Architettura

### Stack Tecnologico
- **Frontend:** Next.js 16 (React 19) + TypeScript + Tailwind CSS
- **Backend:** Next.js Server Actions + API Routes
- **Database:** Supabase (PostgreSQL 15)
- **Auth:** Supabase Auth (Email, Google OAuth)
- **Deploy:** Vercel (CI/CD automatico su push a main)
- **Notifications:** Gmail API + Telegram Bot API

### Flusso Dati
1. Client (Next.js) → Supabase Client SDK (RLS enforced)
2. Server Actions → Supabase Service Role (full access)
3. RPC Functions → SECURITY DEFINER (run as owner)
4. Database Triggers → Logging e validazioni automatiche

---

## 🚀 Setup e Installazione

### Prerequisiti
- Node.js 18+
- npm o yarn
- Git

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/flaviocaloni/Fortitudo_Tennistavolo.git
cd tennistavolo-booking

# 2. Setup environment
cp .env.example .env.local
# Compilare .env.local con credenziali Supabase

# 3. Install dependencies
npm install

# 4. Run dev server
npm run dev
```

Accedere a: `http://localhost:3000`

**Nota:** Le migrazioni SQL vanno eseguite nel Supabase Dashboard → SQL Editor

---

## 📁 Struttura Progetto

```
tennistavolo-booking/
├── src/
│   ├── app/                    # Next.js App Router (Pages)
│   │   ├── calendario/         # Calendario privato
│   │   ├── calendario-pubblico/# Calendario pubblico
│   │   ├── campionato/         # Campionato management
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API routes
│   ├── components/             # React Components (40+)
│   ├── lib/
│   │   ├── supabase/           # Supabase SDK + queries
│   │   ├── actions/            # Server Actions
│   │   ├── utils/              # Utilities
│   │   └── types/              # TypeScript interfaces
│   └── styles/                 # Tailwind CSS
├── supabase/
│   ├── migrations/             # SQL migrations (0001-0057)
│   └── config.toml
├── CHANGELOG.md                # Release notes
├── README.md                   # Questa documentazione
├── CLAUDE.md                   # Setup Claude Code
└── package.json                # v1.2.0
```

---

## 🗄️ Database

### Tabelle Core
- `profiles` — Utenti e metadati
- `training_slots` — Slot allenamenti ricorrenti
- `bookings` — Prenotazioni utenti
- `championship_matches` — Partite campionato
- `championship_match_attendances` — Presenze

### Migrazioni
- **0001-0015:** Schema base + RLS
- **0016-0025:** Prenotazioni
- **0026-0035:** Campionato
- **0036-0057:** Pizza + Notifiche

**Nota:** Eseguire in ordine nel SQL Editor di Supabase

---

## 🔐 Autenticazione e RLS

Tutte le query client-side passano attraverso Row-Level Security (RLS).

Admin usa RPC functions con `SECURITY DEFINER` per operazioni privilegiate che bypassa RLS.

Esempio:
```sql
CREATE FUNCTION get_match_attendances_with_profiles(match_id_param UUID)
  RETURNS TABLE (...)
  LANGUAGE SQL
  SECURITY DEFINER
  SET search_path = public
AS $$ ... $$;
```

---

## 📦 Moduli Principali

### Prenotazioni (`src/lib/supabase/bookings.ts`)
- `getBookingsByUserId()` — Prenotazioni utente
- `getSlotsByDateRange()` — Slot in range date
- `createBooking()` — Crea prenotazione (con validazione limite settimanale)
- `updateBooking()` — Modifica prenotazione

### Campionato (`src/lib/supabase/championships.ts`)
- `getChampionshipById()` — Dettagli campionato
- `getMatchesByChampionshipId()` — Partite
- `getAttendancesByMatchId()` — Presenze partita
- `updateAttendance()` — Registra presenza + notification

### Pizza (`src/lib/supabase/pizza-stats.ts`)
- `getPizzaSlotsByDate()` — Slot pizza per data
- `getPizzaBookingsBySlotId()` — Prenotazioni per slot
- `getPizzaStatistics()` — Statistiche aggregate

---

## 🚀 Deploy

### Deploy Automatico
Push a `main` → GitHub Actions → Vercel deploy

### Environment Variables
Configurate nel dashboard Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

---

## 🐛 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| RLS permission denied | Verifica user login e role in profiles |
| Prenotazione non salva | Controlla limite settimanale (max 2 slot/week) |
| Email non arriva | Verifica Gmail OAuth connesso |
| Timezone scorretto | Il calendario mostra UTC puro (v1.2.0+) |

---

## 📄 Licenza

Proprietà di Flavio Caloni concesso in uso gratuito a Fortitudo Tennistavolo ASD per uso privato dell'associazione.

---

## 📞 Contatti

- **Repository:** https://github.com/flaviocaloni/Fortitudo_Tennistavolo
- **Live:** https://fortitudo-tennistavolo.vercel.app
- **Admin:** f.caloni01@teamsystem.com

---

**Versione:** v1.2.0 (2026-10-08) • Ultimo aggiornamento: 2026-10-08
