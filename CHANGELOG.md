# Changelog

Tutti i cambiamenti significativi del progetto sono documentati in questo file.

## [1.2.0] - 2026-10-08

### ✨ Nuove Funzionalità
- **Timezone Fix:** Corretto il doppio utilizzo di timezone conversion nel calendario campionato
- **UTC Display:** Il calendario mostra direttamente gli orari in UTC senza conversioni locali
- **Pizza Slot UI:** Aggiunto contatore di partecipanti negli slot pizza (modal)
- **Pizza Filtering:** Migliorato il filtraggio delle prenotazioni pizza per slot

### 🐛 Bug Fixes
- Risolto problema di flash behavior (17:15 → 19:15) causato da hydration mismatch tra server e client
- Corretto utilizzo di `getHours()` (local time) → `getUTCHours()` (UTC puro) nel `calendario-filters.tsx`
- Fissato filtraggio delle prenotazioni pizza da client-side a server-side con query parameter `slot_id`
- Aggiunto `SET search_path = public` e schema prefixes espliciti nella RPC `get_slot_participants`

### 📚 Documentazione
- Creato CHANGELOG.md completo con tutte le versioni
- Aggiornato README.md con architettura, features e guida allo sviluppo
- Documentate tutte le migrazioni SQL (0001-0057)
- Documentati i moduli principali: autenticazione, prenotazioni, campionato, pizza

### 🔧 Miglioramenti Tecnici
- Migrazione 0057: Aggiunto campo `selected_participants` a RPC `get_slot_participants`
- Refactored `calendario-filters.tsx` per usare metodi UTC puri
- API pizza bookings: Cambio da filtraggio per nome a filtraggio per `slot_id`
- Removed debug logging di timezone dalla production

### 🚀 Deploy
- Vercel: Deployato correttamente con support UTC diretto
- GitHub Actions: Supabase Preview ha un problema di schema persistence (non critico)

---

## [1.1.0] - 2026-10-05

### ✨ Nuove Funzionalità
- **Championship Match Updates:** Implementata importazione e aggiornamento di 20 match da CSV
- **RLS Improvements:** Migration 0033 per fix accesso nomi agonisti tramite SECURITY DEFINER RPC
- **Attendance Notifications:** Implementate notifiche email e Telegram per presenze campionato

### 🐛 Bug Fixes
- Risolto problema di RLS su profile names in `match_attendances`
- Fissato `current_user_role()` function con GRANT EXECUTE su authenticated role
- Corretto accesso alle presenze della squadra per giocatori non-admin

### 📊 Features
- Migration 0032: Aggiunto `get_match_attendances_with_profiles` RPC con SECURITY DEFINER
- Migration 0033: Permette ai giocatori di vedere nomi squadra nonostante RLS
- Championship attendance history logging implementato

---

## [1.0.0] - 2026-09-30

### 🚀 Release Iniziale
- **Architettura:** Next.js 16 + Supabase (PostgreSQL + Auth + RLS)
- **Features Principali:**
  - Sistema di prenotazioni slot allenamenti con limite settimanale
  - Calendario pubblico e admin per visualizzazione slot
  - Gestione presenze campionato con notifiche
  - Sistema di ruoli (admin, agonista, amatore) con RLS

### 📦 Moduli Core
- **Authentication:** Supabase Auth con social login (Google)
- **Bookings:** Prenotazioni slot ricorrenti con selected_participants
- **Pizza Slots:** Slot pizza senza limiti settimanali
- **Championship:** Gestione partite, presenze, notifiche
- **Notifications:** Email (Gmail OAuth), Telegram per campionato

### 🗄️ Database
- 57 migrazioni SQL (0001-0057)
- Row-Level Security (RLS) policies su tutte le tabelle sensibili
- RPC functions con SECURITY DEFINER per operazioni privilegiate
- Triggers per logging e validazioni

### 📱 UI/UX
- Responsive design con Tailwind CSS
- Dark mode support
- Modali e componenti riutilizzabili
- Calendario interattivo per visualizzazione slot

### 🔐 Sicurezza
- Autenticazione tramite Supabase Auth
- Row-Level Security su tutte le query
- Server Actions per form submissions
- Credenziali segrete in `.env.local` (gitignored)

### 📝 Documentazione
- CLAUDE.md con setup e credenziali
- Migrazioni SQL numerate e ordinate
- Commenti nel codice per logica complessa
- Type safety con TypeScript

---

## Convenzioni di Versionamento

Questo progetto segue [Semantic Versioning](https://semver.org/):

- **MAJOR:** Breaking changes (es: rimozione di features, cambio API)
- **MINOR:** Nuove features o improvements (es: new features, nuove colonne nel DB)
- **PATCH:** Bug fixes (es: correzioni di logica, piccoli aggiustamenti)

**Formato:** `[MAJOR].[MINOR].[PATCH]`

---

## Release Timeline

| Versione | Data | Focus |
|----------|------|-------|
| 1.0.0 | 2026-09-30 | MVP iniziale |
| 1.1.0 | 2026-10-05 | Championship improvements + RLS fixes |
| 1.2.0 | 2026-10-08 | Timezone fixes + UI improvements |

---

## Deploy History

- **Staging:** GitHub Deployments (Supabase Preview)
- **Production:** Vercel (https://fortitudo-tennistavolo.vercel.app)
- **Database:** Supabase PostgreSQL (kzlnxnfwwfgqmqcvdyox)
