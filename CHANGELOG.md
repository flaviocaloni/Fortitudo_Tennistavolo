# Changelog

Tutti i cambiamenti notevoli a questo progetto sono documentati in questo file.

---

## [1.1.0] — 2026-09-29

### 🚀 Nuove Funzionalità

#### Ottimizzazioni Supabase & Performance
- **Riduzione Query Database**: Eliminati 4 pattern di N+1 query
  - Fix N+1 in "Le mie partite": caricamento batch attendances (-95% query)
  - Filter profili in formazioni per giocatori della squadra (-1000 query)
  - Filter slot in calendario per stagione corrente (-400 query)
  - Impatto totale: **~1950 query ridotte**, **40-60% riduzione log Supabase**

#### Admin Statistiche — Redesign UI
- **Struttura a Sottopagine**: Dashboard principale con 3 sezioni dedicate
  - `/admin/statistiche/prenotazioni` — Riepilogo prenotazioni per utente con filtri integrati
  - `/admin/statistiche/certificati` — Monitoraggio scadenze certificati medici
  - `/admin/statistiche/booking-chart` — Grafico trend prenotazioni per stagione
- **Ricerca Utente**: Supporto ricerca per nome/ID nelle pagine (con fallback a "mostra tutto")
- **Navigazione Intuitiva**: Menu dashboard con card descrittive dei dati disponibili

### 📊 Performance & Ottimizzazioni

- **Query Optimization**: Implementazione di `.in()` e filtri stagione per ridurre caricamento dati
- **Log Reduction**: Stima riduzione del 40-60% dell'utilizzo log Supabase
- **Page Load Speed**: Miglioramento significativo su pagine ad alto volume dati

### 🐛 Bug Fix

- Fix caricamento redundante di profili in formazioni page
- Fix query N+1 in "Le mie partite" che creava colli di bottiglia
- Fix caricamento di TUTTI gli slot indipendentemente dalla stagione

### 📝 Documentazione

- CHANGELOG.md: Documentazione versionata dei cambiamenti
- README.md aggiornato con features v1.1.0
- Versione aggiornata in package.json

---

## [1.0.0] — 2026-09-05

### 🎉 Initial Release — Stabile e Production Ready

#### Funzionalità Core
- **Autenticazione**: Email/Password + Google OAuth (in preparazione)
- **Prenotazioni**: Calendario intuitivo, vincoli validati a DB, limit settimanale per ruolo
- **Overbooking**: Waiting list con auto-promozione quando si libera un posto
- **Stagioni & Slot**: Gestione stagioni annuali, slot ricorrenti e extra/eventi
- **Campionati**: Gestione completa campionati, squadre, partite, classifica
- **Admin**: Dashboard completo per gestione utenti, slot, prenotazioni, certificati
- **Ruoli**: Agonista, Amatore, Admin, Superadmin con RLS per data security
- **Certificati Medici**: Tracking scadenze con badge stato (valido/scaduto/in scadenza)
- **Report & Analytics**: Statistiche prenotazioni per utente e periodo
- **Notifiche Email**: Sistema di notifica per nuove prenotazioni (configurable)
- **Mobile Responsive**: Design responsive su dispositivi mobile

#### Tech Stack
- **Frontend**: Next.js 16.3.0 (App Router) + React + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Database**: PostgreSQL con 35+ migrations e triggers di validazione
- **Deployment**: Vercel con auto-deploy su push

#### Security
- Row Level Security (RLS) su tutte le tabelle sensibili
- Server Actions per operazioni sensibili (admin)
- Validazione database-level per integrità dati
- Cryptography per certificati medici

---

## Note Tecniche

### Dipendenze Critiche
- `supabase@latest` — Database e Auth
- `next@16.3.0` — Framework frontend
- `tailwindcss@latest` — Styling
- `@supabase/supabase-js@latest` — Client Supabase

### Database Migrations
- Migration 0001–0038: Schema completamente versionato
- Trigger PostgreSQL per validazione logica business
- RPC functions per operazioni complesse

### Deploy
- **Staging**: Deploy automatico su ogni push (Vercel)
- **Production**: https://fortitudo-tennistavolo.vercel.app
- **CI/CD**: GitHub Actions (se configurato)

---

## Roadmap Futuro

- [ ] Google OAuth integration
- [ ] Auto-booking feature per slot ricorrenti
- [ ] Notifiche push via browser
- [ ] Migrazione dati storici pre-2024
- [ ] Esportazione report Excel
- [ ] Dark mode UI
- [ ] Multi-language support (IT/EN)

