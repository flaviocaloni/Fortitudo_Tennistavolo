# Roadmap — Versione 1.0.0 e Beyond

## 📌 Versione 1.0.0 (Stabile)

**Release Date:** 2026-09-06  
**Status:** ✅ Production Ready

Tutte le features core sono stabili e testate in produzione:
- ✅ Gestione stagioni e slot
- ✅ Prenotazioni e overbooking
- ✅ Gestione utenti e profili
- ✅ Campionati, squadre, partite, classifica
- ✅ Statistiche e report
- ✅ Supporto multi-ruolo (agonista, amatore, admin, superadmin)

---

## 🚧 In Sviluppo — Versione 1.1.0 (ETA: Q4 2026)

### 📧 Email Notifications (Priorità Alta)

**Status:** Infrastruttura 80% completa, invio non attivo

#### Cosa è Pronto
- Database tables: `notification_config`, `championship_notifications`
- RPC function pronta per trigger invio
- API endpoint: `POST /api/notifications` (non ancora integrata)
- Templates email definiti

#### Cosa Manca
1. **Provider Email Integration**
   - Scelta tra: SendGrid, AWS SES, Resend, Mailgun
   - Configurazione credenziali
   - Test invio

2. **Trigger Automazione**
   - Cron job giornaliero per reminder 24h
   - Cron job waiting list promotion
   - Event-based triggers (prenotazione, cambio presenze)

3. **UI Utente**
   - Sezione preferenze notifiche in `/profilo`
   - Toggle on/off per tipo notifica
   - Storico notifiche inviate

#### Trigger Pianificati
- ✅ **Conferma Prenotazione:** Immediato dopo booking
- ✅ **Reminder 24h:** Giorno prima prenotazione
- ✅ **Cambio Presenze Campionato:** Quando admin modifica stato
- ✅ **Promozione Waiting List:** Automatica quando si libera posto

#### Timeline Stima
- Scelta provider: 1-2 giorni
- Implementazione provider: 3-5 giorni
- Integrazione cron job: 2-3 giorni
- Test e QA: 2-3 giorni
- **Totale:** ~2 settimane

---

### 🤖 Auto-Booking Recurring Slots (Priorità Media)

**Status:** Design approvato, implementazione non avviata

#### Descrizione
Superadmin abilita feature per utenti selezionati. Utente sceglie quali slot ricorrenti auto-prenotare. Cron job daily pre-prenota per 30 giorni in avanti.

#### Funzionalità
- Superadmin → `/admin/sys/auto-booking` per assegnare feature
- Utente → `/calendario/auto-booking` per selezionare slot
- Cron job → `/api/cron/auto-booking` ogni 00:05 UTC
- No retroattivo: auto-booking da domani in avanti
- Idempotente: no duplicati se cron riesegue

#### Implementazione
- Migration DB (0038): 2 tabelle, 1 RPC function
- Server actions: `toggleUserAutoBooking()`, `toggleSlotAutoBooking()`
- Pages: 2 nuove (/admin/sys/auto-booking, /calendario/auto-booking)
- Cron endpoint: `src/app/api/cron/auto-booking/route.ts`
- vercel.json: configurazione cron schedule

#### Timeline Stima
- DB migration e RPC: 2-3 giorni
- Server actions: 1-2 giorni
- UI pages: 3-4 giorni
- Cron job: 1-2 giorni
- Test e QA: 2-3 giorni
- **Totale:** ~2 settimane

---

## 🔄 Maintenance & Bug Fixes

- Weekly security updates per dipendenze
- Monthly database optimization
- Quarterly performance audit
- Continuous monitoring Vercel/Supabase metrics

---

## 📞 Feedback e Prioritizzazione

Per richiedere una feature o segnalare un bug:
1. Crea issue su [GitHub](https://github.com/flaviocaloni/Fortitudo_Tennistavolo/issues)
2. Label: `enhancement`, `bug`, `question`
3. Descrivi caso d'uso e priorità
4. Feedback raccolto per revisione roadmap quarterly

---

**Last Updated:** 2026-09-06  
**Next Review:** 2026-12-06
