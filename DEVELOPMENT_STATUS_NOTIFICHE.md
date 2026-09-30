# 📧 Stato Sviluppo: Notifiche Email

**Data ultimo aggiornamento**: 2026-09-30
**Stato**: 🟡 **IN PROGRESS** — Bloccato su configurazione Gmail OAuth (Step 1 di 6 in corso)

---

## 📋 Due Feature Distinte

### A) Notifica "Prenotazione Evento" (`EVENT_NON_RECURRING_BOOKING`)
✅ **Codice completo al 100%** (DB, trigger, UI admin) — manca solo la configurazione Gmail OAuth per poter inviare davvero le email.

### B) Notifica "Rimozione Presenza Campionato" (`CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED`)
⚠️ **Solo UI di configurazione implementata** (toggle attivazione, scelta destinatari in `/admin/notifiche?tab=campionato`). **Manca la logica di invio effettiva**: non è collegata a `updateMyAttendance()` / `updateAdminAttendance()` in `src/lib/actions/championships.ts`. Da implementare da zero quando si riprende (riusare `email-sender.ts` + `recipients-resolver.ts`, già generici).

**Decisione presa il 2026-09-30**: si riprende **solo la Parte A** per ora. La Parte B resta ferma.

---

## ✅ COMPLETATO (Parte A)

### Database (Supabase)
- ✅ Migration `0021_notification_config.sql` applicata
- ✅ Tabelle: `notification_configs`, `notification_delivery`, `notification_audit`
- ✅ ENUM types, RLS, trigger di audit, indici

### Backend (Next.js)
- ✅ `src/lib/services/email-sender.ts` — invio via Gmail OAuth (nodemailer)
- ✅ `src/lib/services/recipients-resolver.ts` — risoluzione destinatari (ALL_ADMINS/ALL_USERS/MANUAL)
- ✅ `src/lib/supabase/notifications.ts` — query helper
- ✅ `src/lib/actions/notifications.ts` — server actions (toggle, update recipients, fetch config/audit/liste utenti)
- ✅ Trigger integrato in `bookSlot()` (`src/lib/actions/bookings.ts`):
  - `sendNotificationForBooking()` fire-and-forget, non blocca la prenotazione
  - Invia solo per slot evento (non ricorrente, `event_date` valorizzato)
  - Deduplicazione per booking + recipient (constraint UNIQUE su `delivery_idempotency_key` + check su `notification_delivery`)
- ✅ **Fix 2026-09-30**: `notification_config_id` non più hardcoded a `1` in `email-sender.ts` — ora passato esplicitamente come parametro (commit `c41d965`)

### Frontend
- ✅ `src/app/admin/notifiche/page.tsx` — pagina con tab "Prenotazioni" / "Campionato"
- ✅ `src/components/notification-config-form.tsx` — form toggle + destinatari + audit log
- ✅ Link in navbar admin (`src/app/admin/layout.tsx`, `src/app/admin/page.tsx`)

---

## 🟡 IN PROGRESS: Gmail OAuth (Parte A — unico blocco rimanente)

### Contesto importante
Il progetto Google Cloud **"Fortitudo-Tennistavolo"** esiste già (creato per un'altra feature — Google Drive Picker per gestione file admin, **poi rimossa interamente il 2026-09-30** per problemi di privacy/UX). La Consent Screen è già in stato **"In produzione"**, tipo utente **"Esterno"**, con Branding già compilato (nome app, email supporto, homepage, privacy policy). **Va solo integrato lo scope Gmail**, non serve ricreare tutto da zero.

⚠️ **Differenza chiave rispetto al Drive Picker (che ha dato molti problemi)**: qui useremo OAuth tipo **"Applicazione desktop"** con flusso "installed app" — **un solo utente (lo sviluppatore) autorizza una volta sola** tramite script locale, ottenendo un `refresh_token` permanente usato lato server. Nessun popup ricorrente per gli admin, nessun rischio "app non verificata" visibile agli utenti finali.

### Piano step-by-step (dove siamo)

1. ⏳ **[IN CORSO]** Aggiungere scope Gmail alla Consent Screen:
   - Google Cloud Console → Google Auth Platform → **Accesso ai dati** (Data Access)
   - Se necessario, prima abilitare **"Gmail API"** da APIs e servizi → Libreria
   - Aggiungere scope `https://www.googleapis.com/auth/gmail.send`
   - Salvare

2. ⬜ Creare un nuovo **OAuth Client ID** tipo **"Applicazione desktop"**:
   - Google Auth Platform → Client → Crea client
   - Nome suggerito: `fortitudo-gmail-notifier`
   - Copiare `Client ID` e `Client secret`

3. ⬜ Generare il `REFRESH_TOKEN` con script locale (vedi sotto)

4. ⬜ Configurare 4 variabili d'ambiente su **Vercel** (Config, non serve prefisso NEXT_PUBLIC_ — usate solo server-side):
   ```
   GMAIL_USER = flavio.caloni@gmail.com (o infotennistavolo@gmail.com)
   GMAIL_CLIENT_ID = <da step 2>
   GMAIL_CLIENT_SECRET = <da step 2>
   GMAIL_REFRESH_TOKEN = <da step 3>
   ```
   Aggiungere gli stessi valori anche in `.env.local` per test in locale.

5. ⬜ Redeploy Vercel

6. ⬜ Test end-to-end (vedi sezione TESTING PLAN sotto)

---

## 📝 SCRIPT: Generare Refresh Token

Creare un file temporaneo `get-refresh-token.js` nella root del progetto (NON committarlo — aggiungerlo a `.gitignore` o cancellarlo dopo l'uso):

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'CLIENT_ID_DA_STEP_2',
  'CLIENT_SECRET_DA_STEP_2',
  'urn:ietf:wg:oauth:2.0:oob' // redirect per app desktop, mostra il code a schermo
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forza il rilascio di un nuovo refresh_token
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('Autorizza visitando questo URL, poi copia il "code" mostrato da Google:');
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
# Apri l'URL stampato nel browser, accedi con l'account Gmail scelto, autorizza
# Google mostra un "code" a schermo (flusso desktop, nessun redirect a un server)
node get-refresh-token.js <code>
# Stampa il REFRESH_TOKEN
```

---

## 🧪 TESTING PLAN (da eseguire dopo Step 4-5)

### Prerequisiti
- [ ] Gmail OAuth configurato in Vercel (4 variabili)
- [ ] Deployment Vercel completato

### Test Manuale
1. Admin va su `/admin/notifiche` (tab Prenotazioni) → clicca "Attiva"
2. Admin crea uno slot **evento** (non ricorrente) in `/admin/slot`
3. Un utente (non admin) prenota quello slot
4. Verificare ricezione email all'indirizzo admin configurato
5. Verificare in Supabase: `SELECT * FROM notification_delivery ORDER BY created_at DESC LIMIT 5;`

### Edge Case da verificare
- [ ] Slot ricorrente → nessuna email (solo eventi)
- [ ] Notifica disattivata → nessuna email
- [ ] Doppia prenotazione stesso booking → 1 sola email (deduplicazione)
- [ ] Errore invio → prenotazione resta comunque confermata

---

## 📌 Note Tecniche

- **Email Provider**: Gmail OAuth via nodemailer (soluzione MVP, non un servizio email dedicato)
- **Invio**: fire-and-forget asincrono, non blocca la prenotazione
- **Rate limit Gmail**: ~100-200 email/giorno per account — sufficiente per il volume attuale del club
- **Limite attuale**: mittente fisso, una sola notifica realmente funzionante (booking evento)

## 🔮 Prossimi Passi (dopo aver sbloccato Parte A)
1. Completare Parte B (invio email reale per rimozione presenza campionato)
2. Eventuale migrazione futura a provider email dedicato (Resend, SendGrid) se il volume cresce

---

## 👤 Riferimenti
- Proprietario: Flavio Caloni (f.caloni01@teamsystem.com)
- Account Gmail per invio: da confermare tra flavio.caloni@gmail.com / infotennistavolo@gmail.com
- Progetto Google Cloud: **Fortitudo-Tennistavolo** (già esistente)
