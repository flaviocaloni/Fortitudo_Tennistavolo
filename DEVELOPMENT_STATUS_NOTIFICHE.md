# 📧 Stato Sviluppo: Notifiche Email

**Data**: 2026-09-03/04  
**Feature**: Notifiche email per prenotazioni su slot evento non ricorrente  
**Stato**: 🟡 **IN PROGRESS** — Bloccato su configurazione Google OAuth

---

## ✅ COMPLETATO

### Database (Supabase)
- ✅ Migration SQL `0021_notification_config.sql` applicata
- ✅ Tabelle create:
  - `notification_configs` — configurazione notifiche
  - `notification_delivery` — storico invii email
  - `notification_audit` — audit log modifiche
- ✅ ENUM types: `notification_code`, `recipient_mode`, `delivery_status`
- ✅ RLS (Row Level Security) configurato
- ✅ Trigger e funzioni PL/pgSQL implementati
- ✅ Indici per performance

### Backend (Next.js)
- ✅ Package: `nodemailer`, `@types/nodemailer` aggiunto
- ✅ Servizi creati:
  - `src/lib/services/email-sender.ts` — invio via Gmail OAuth
  - `src/lib/services/recipients-resolver.ts` — risoluzione destinatari
  - `src/lib/supabase/notifications.ts` — query helper
- ✅ Server actions: `src/lib/actions/notifications.ts`
  - `toggleNotification()` — attiva/disattiva
  - `updateRecipientMode()` — cambia modalità destinatari
  - `fetchNotificationConfig()`, `fetchNotificationAuditLog()`, `fetchAdminsList()`, `fetchUsersList()`
- ✅ Trigger integrato in `bookSlot()`:
  - `sendNotificationForBooking()` — fire-and-forget asincrono
  - Invia solo per slot evento (non ricorrente)
  - Deduplicazione per booking + recipient
  - Errori non bloccano la prenotazione
- ✅ Build, TypeScript, lint — ✅ Nessun errore

### Frontend (React + Admin)
- ✅ Pagina: `src/app/admin/notifiche/page.tsx`
- ✅ Componente form: `src/components/notification-config-form.tsx`
  - Toggle attivazione/disattivazione
  - Modalità destinatari (ALL_ADMINS, ALL_USERS, MANUAL)
  - Anteprima destinatari
  - Audit log storico
- ✅ Menu admin: link aggiunto a `/admin/notifiche`

### Configurazione
- ✅ `.env.example` aggiornato con variabili Gmail OAuth
- ✅ `types.ts` esteso con tipi notifiche
- ✅ `package.json` aggiornato

### Git
- ✅ Commit `fcbc8ea` — Implementazione completa
- ✅ Commit `3ba982a` — Fix trigger auth.uid()
- ✅ Commit `8c84144` — Fix modified_by nullable
- ✅ Tutti i commit pushati a `main`

---

## 🟡 IN PROGRESS: Google OAuth

### Punto di blocco
Configurazione credenziali Google per invio email via Gmail OAuth.

### Step completati
1. ✅ Progetto Google Cloud creato: `Fortitudo Tennistavolo`
2. ✅ Gmail API abilitata
3. ⏳ OAuth Consent Screen — **IN PROGRESS**

### Prossimi step (per Flavio)
1. **Configura OAuth Consent Screen** su Google Console:
   - URL: https://console.cloud.google.com/
   - Menu: OAuth consent screen
   - User Type: **External**
   - App name: `Fortitudo Tennistavolo`
   - Support email: `flavio.caloni@gmail.com`
   - Developer contact: `flavio.caloni@gmail.com`
   - Scopes: Aggiungi `gmail.send` (Gmail API)
   - Salva

2. **Genera Client ID e Secret**:
   - Credentials → Create OAuth Client ID
   - Application type: **Applicazione desktop**
   - Copia:
     - `CLIENT_ID`
     - `CLIENT_SECRET`

3. **Genera Refresh Token**:
   - Usa script Node.js locale (vedi sotto)
   - Ottieni `REFRESH_TOKEN`

4. **Configura Vercel**:
   - Dashboard → tennistavolo-booking → Settings → Environment Variables
   - Aggiungi:
     ```
     GMAIL_USER = flavio.caloni@gmail.com
     GMAIL_CLIENT_ID = [da Google]
     GMAIL_CLIENT_SECRET = [da Google]
     GMAIL_REFRESH_TOKEN = [da script]
     ```
   - Redeploy

5. **Test manuale** (vedi sezione TESTING)

---

## 📝 SCRIPT: Generare Refresh Token

**File**: `get-refresh-token.js` (nella root del progetto)

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',         // Sostituisci con CLIENT_ID da Google
  'YOUR_CLIENT_SECRET',     // Sostituisci con CLIENT_SECRET da Google
  'http://localhost:3000/auth/callback'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('Autorizza visitando:');
console.log(authUrl);

const code = process.argv[2];
if (code) {
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Errore:', err);
      return;
    }
    console.log('\n✅ REFRESH TOKEN:');
    console.log(token.refresh_token);
  });
}
```

**Uso**:
```bash
npm install googleapis
node get-refresh-token.js
# Copia URL nel browser → Autorizza → Ricevi code nella URL
node get-refresh-token.js <code>
# Ottieni REFRESH_TOKEN
```

---

## 🧪 TESTING PLAN

### Prerequisiti
- [ ] Gmail OAuth configurato in Vercel (4 variabili)
- [ ] Supabase migration applicata
- [ ] Deployment Vercel completato

### Test Manuale
1. **Admin accede a `/admin/notifiche`**
   - [ ] Vede card "Prenotazione Evento"
   - [ ] Stato: DISATTIVA, modalità ALL_ADMINS

2. **Admin attiva notifica**
   - [ ] Clicca "Attiva"
   - [ ] Redirect con success message
   - [ ] Badge: ATTIVA

3. **Admin crea slot evento**
   - [ ] `/admin/slot` → Nuovo evento
   - [ ] Es: "Torneo" il 10-09-2026, 18:00-20:00

4. **Utente prenota evento**
   - [ ] Logout admin
   - [ ] Login come amatore
   - [ ] `/calendario` → Prenota evento
   - [ ] Prenotazione confermata ✓

5. **Email inviata**
   - [ ] Inbox flavio.caloni@gmail.com
   - [ ] Soggetto: "Nuova prenotazione: Torneo il ..."
   - [ ] Contiene link "Vedi Prenotazione"

6. **Admin verifica storico**
   - [ ] Login admin
   - [ ] `/admin/notifiche` → Destinatari
   - [ ] "Anteprima Destinatari" → mostra admin Flavio

### Test Edge Cases
- [ ] **Slot ricorrente**: NO email (solo evento)
- [ ] **Notifica disattivata**: NO email
- [ ] **Duplicazione**: Stessa prenotazione → 1 email
- [ ] **Errore email**: Prenotazione rimane confermata
- [ ] **Utente senza email**: Skipped
- [ ] **Utente disattivato**: Skipped

### Query di verifica (SQL)
```sql
-- Invii email
SELECT * FROM notification_delivery ORDER BY created_at DESC LIMIT 10;

-- Audit log
SELECT * FROM notification_audit ORDER BY modified_at DESC LIMIT 10;

-- Config
SELECT * FROM notification_configs;
```

---

## 🔗 Risorse Esterne

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Docs](https://developers.google.com/gmail/api)
- [Nodemailer OAuth2](https://nodemailer.com/smtp/oauth2/)
- [Vercel Env Vars](https://vercel.com/docs/environment-variables)

---

## 📌 Note di Sviluppo

### Decisioni Tecniche
1. **Email Provider**: Gmail OAuth via nodemailer (MVP temporanea, non servizio esterno)
2. **Invio**: Fire-and-forget asincrono (non blocca prenotazione)
3. **Errori**: Registrati in `notification_delivery` ma non mostrati all'utente
4. **Deduplicazione**: UUID + booking_id + recipient_user_id
5. **RLS**: Accesso limitato agli admin

### Limitazioni Attuali
- Mittente fisso: `flavio.caloni@gmail.com` (Flavio)
- Solo modalità EMAIL (no SMS, push, ecc.)
- Una sola notifica: `EVENT_NON_RECURRING_BOOKING`
- Rate limit Gmail: ~100-200 email/giorno per account

### Prossimi Miglioramenti (Future)
- [ ] Migrare a provider email dedicato (Resend, Sendgrid)
- [ ] Aggiungere notifiche per altri eventi (cancellazione, overbooking, ecc.)
- [ ] Coda asincrona (job queue)
- [ ] Template email customizzabili
- [ ] Webhook per integrazioni esterne

---

## 👤 Proprietario

Flavio Caloni (f.caloni01@teamsystem.com)  
**Contatto per domande**: Revisione git commits, controllo database, test UI

---

**Ultimo aggiornamento**: 2026-09-04 00:30 UTC  
**Prossimo step**: Completare configurazione Google OAuth
