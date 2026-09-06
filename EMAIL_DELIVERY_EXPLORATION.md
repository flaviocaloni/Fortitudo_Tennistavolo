# Email Delivery — Esplorazione Modalità Invio

Documento di ricerca sulle diverse modalità per inviare email in produzione, con focus su account Gmail/casella email personale (senza dominio proprietario).

---

## 📋 Indice

1. [Modalità di Invio](#modalità-di-invio)
2. [Confronto Servizi](#confronto-servizi)
3. [Template System](#template-system)
4. [Tracciamento Email](#tracciamento-email)
5. [Admin UI Design](#admin-ui-design)
6. [Piano Implementazione](#piano-implementazione)

---

## Modalità di Invio

### Opzione 1️⃣: SMTP Gmail (Gmail App Password)

**Descrizione:**  
Invia email direttamente dal server usando credenziali Gmail via SMTP protocol.

**Come Funziona:**
1. Enable 2FA su account Gmail
2. Genera "App Password" da Google Account Security
3. Usa credenziali in `.env.local`: `SMTP_USER=tue@gmail.com`, `SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx`
4. Libreria Node: Nodemailer (built-in SMTP support)

**Pro:**
- ✅ Nessuna registrazione esterna required
- ✅ Gratis (limiti Gmail: ~500 email/giorno)
- ✅ Semplice setup
- ✅ Nodemailer standard library
- ✅ Completo controllo

**Contro:**
- ❌ Limite ~500 email/giorno (insufficiente se club cresce)
- ❌ Rischio account bloccato per volume
- ❌ Email può finire in spam (no sender reputation)
- ❌ No bounce tracking automatico
- ❌ Headers Gmail visibili ("sent from Gmail" issue)
- ❌ Scadenza App Password periodica

**Implementazione (Nodemailer):**
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,    // tue@gmail.com
    pass: process.env.SMTP_PASSWORD // Google App Password
  }
});

// Invio
await transporter.sendMail({
  from: 'tue@gmail.com',
  to: 'destinatario@example.com',
  subject: 'Conferma Prenotazione',
  html: '<html>...</html>'
});
```

**Cost:** FREE (pero con limiti)  
**Setup Time:** ~10 minuti  
**Affidabilità:** ⭐⭐⭐ (bassa per produzione)

---

### Opzione 2️⃣: SendGrid (SMTP o API)

**Descrizione:**  
Servizio email professionista con SMTP e REST API. Tier gratuito: 100 email/giorno.

**Come Funziona:**
1. Registra account su sendgrid.com
2. Verifica dominio (o usa generica SendGrid domain)
3. Genera API Key
4. Usa Nodemailer SMTP o SDK `@sendgrid/mail`

**Pro:**
- ✅ Free tier: 100 email/giorno
- ✅ Paid tier: 10k email/mese ~$30/mese
- ✅ Dashboard con stats (bounce, open rate, click rate)
- ✅ Webhook events (delivered, opened, clicked, bounced)
- ✅ Template system built-in
- ✅ Good sender reputation (SendGrid domain)
- ✅ Easy integration

**Contro:**
- ⚠️ Richiede verifica dominio per brand email
- ⚠️ Free tier limite 100/giorno (solo test)
- ⚠️ Tier a pagamento per volume produzione
- ❌ Costo crescente con volume

**Implementazione (SDK):**
```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'destinatario@example.com',
  from: 'noreply@fortitudo.it', // SendGrid verified domain
  subject: 'Conferma Prenotazione',
  html: '<html>...</html>'
});
```

**Cost:** FREE (100/giorno) → $30/mese (10k)  
**Setup Time:** ~15 minuti  
**Affidabilità:** ⭐⭐⭐⭐⭐ (eccellente)

---

### Opzione 3️⃣: AWS SES (Simple Email Service)

**Descrizione:**  
Servizio email AWS con SMTP e API. Tier gratuito: 200 email/giorno (primo anno).

**Come Funziona:**
1. AWS Account (free tier available)
2. Verifica dominio o email in SES console
3. Genera SMTP credentials
4. Usa Nodemailer SMTP

**Pro:**
- ✅ Free: 200 email/giorno (primo anno)
- ✅ Dopo: $0.10 per 1000 email (~$0.10 per 1000)
- ✅ Webhook events supportati
- ✅ Altamente scalabile
- ✅ Buona reputazione

**Contro:**
- ❌ Setup AWS complesso per principianti
- ❌ Richiede verifica dominio
- ⚠️ Tier gratuito solo primo anno
- ⚠️ Costo per volume (anche piccolo)

**Cost:** FREE (200/giorno × 1 anno) → ~$0.10/1000  
**Setup Time:** ~30 minuti  
**Affidabilità:** ⭐⭐⭐⭐⭐ (eccellente)

---

### Opzione 4️⃣: Resend (Moderno - Consigliato per Vercel)

**Descrizione:**  
Servizio email moderno pensato per developer con Next.js/Vercel. Tier gratuito generoso.

**Come Funziona:**
1. Registra account su resend.com
2. Verifica dominio (o usa `onboarding@resend.dev` per test)
3. Genera API Key
4. Usa SDK `resend` o HTTP API

**Pro:**
- ✅ Free: 100 email/giorno
- ✅ Paid: $20/mese per 50k email
- ✅ Built-in template system (React components!)
- ✅ Webhook events supportati
- ✅ Dashboard intuitivo
- ✅ Ottimizzato per Next.js/Vercel
- ✅ Email preview in real-time
- ✅ Support eccellente

**Contro:**
- ⚠️ Servizio più nuovo (stabilità?)
- ⚠️ Richiede verifica dominio per produzione
- ⚠️ Free tier 100/giorno (ok per club)

**Implementazione (SDK):**
```javascript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@fortitudo.it',
  to: 'destinatario@example.com',
  subject: 'Conferma Prenotazione',
  html: '<html>...</html>'
});
```

**Cost:** FREE (100/giorno) → $20/mese (50k)  
**Setup Time:** ~10 minuti  
**Affidabilità:** ⭐⭐⭐⭐ (molto buono)

---

### Opzione 5️⃣: Mailgun

**Descrizione:**  
Servizio email enterprise-grade con API sofisticata. Free tier: 100 email/giorno.

**Come Funziona:**
1. Registra account su mailgun.com
2. Verifica dominio
3. Genera API Key
4. Usa SDK `mailgun.js` o HTTP API

**Pro:**
- ✅ Free: 100 email/giorno
- ✅ Paid: ~$35/mese per 50k email
- ✅ Advanced features (webhooks, bounce tracking)
- ✅ Stabilità enterprise
- ✅ Template system

**Contro:**
- ⚠️ Interfaccia meno intuitiva
- ⚠️ Documentazione meno accessible
- ⚠️ Free tier limitato

**Cost:** FREE (100/giorno) → ~$35/mese  
**Setup Time:** ~20 minuti  
**Affidabilità:** ⭐⭐⭐⭐⭐ (eccellente)

---

### Opzione 6️⃣: Brevo (ex-Sendinblue)

**Descrizione:**  
Piattaforma marketing email all-in-one. Free tier: 300 email/giorno.

**Come Funziona:**
1. Registra account su brevo.com
2. Verifica dominio
3. Genera API Key
4. Usa API HTTP

**Pro:**
- ✅ Free: 300 email/giorno (tier più generoso!)
- ✅ Paid: $20/mese per illimitato
- ✅ Dashboard completo
- ✅ Automazione marketing
- ✅ Template builder drag-and-drop

**Contro:**
- ⚠️ Interfaccia talvolta confusa
- ⚠️ Documentazione API non ottimale

**Cost:** FREE (300/giorno) → $20/mese  
**Setup Time:** ~20 minuti  
**Affidabilità:** ⭐⭐⭐⭐ (buono)

---

## Confronto Servizi

| Servizio | Free Tier | Paid | Setup | Affidabilità | Migliore Per |
|----------|-----------|------|-------|--------------|-------------|
| **Gmail SMTP** | 500/giorno | N/A | ⭐ Facile | ⭐⭐⭐ Bassa | Testing solo |
| **SendGrid** | 100/giorno | $30/mese | ⭐⭐ Medio | ⭐⭐⭐⭐⭐ Eccellente | Produzione stabile |
| **AWS SES** | 200/giorno* | $0.10/1000 | ⭐⭐⭐ Complesso | ⭐⭐⭐⭐⭐ Eccellente | Volume alto |
| **Resend** | 100/giorno | $20/mese | ⭐ Facile | ⭐⭐⭐⭐ Ottimo | Next.js/Vercel |
| **Mailgun** | 100/giorno | $35/mese | ⭐⭐ Medio | ⭐⭐⭐⭐⭐ Eccellente | Advanced features |
| **Brevo** | 300/giorno* | $20/mese | ⭐⭐ Medio | ⭐⭐⭐⭐ Buono | Free tier generoso |

*Tier gratuito più generoso

### 🎯 Raccomandazione per Fortitudo

**Per Development (v1.1.0):**
- **1ª Scelta:** Resend (Next.js native, facile, free tier 100/giorno)
- **Alternativa:** SendGrid (stabilità, features, comunità ampia)

**Motivi:**
1. Club ~50-100 utenti → 100 email/giorno sufficiente
2. Next.js nativo → Resend perfetto
3. Setup facile → meno problemi
4. Scalabilità: se cresce, upgrade a $20/mese (50k email)
5. Template system React built-in (Resend) → perfetto per app

---

## Template System

### Design Principi

**Template HTML:**
1. Responsive (mobile-first)
2. Inline CSS (no external stylesheets)
3. Variable substitution: `{{user_name}}`, `{{booking_date}}`, ecc
4. Preview in admin dashboard
5. Storico versioni

### Database Schema

```sql
-- Tabella template email
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- "booking_confirmation"
  subject VARCHAR(255) NOT NULL,     -- "Conferma Prenotazione {{slot_name}}"
  html_body TEXT NOT NULL,           -- HTML completo
  variables JSONB,                   -- ["user_name", "slot_name", "booking_date"]
  created_by UUID FK profiles,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  version INT DEFAULT 1,             -- Storico versioni
  active BOOLEAN DEFAULT true
);

-- Tabella storico versioni template
CREATE TABLE email_template_versions (
  id UUID PRIMARY KEY,
  template_id UUID FK email_templates,
  version INT,
  subject VARCHAR(255),
  html_body TEXT,
  changed_by UUID FK profiles,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella tracciamento email inviate
CREATE TABLE sent_emails (
  id UUID PRIMARY KEY,
  recipient_email VARCHAR(255),
  recipient_user_id UUID FK profiles (nullable),
  template_name VARCHAR(100),      -- Reference template usato
  subject VARCHAR(255),
  sent_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(50),              -- "sent", "delivered", "bounced", "opened", "clicked"
  provider VARCHAR(50),            -- "resend", "sendgrid", "aws_ses"
  provider_message_id VARCHAR(255), -- ID da provider (per tracking)
  error_message TEXT (nullable),   -- Se fallito
  variables JSONB,                 -- Variables usati per rendering
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella webhook events da provider
CREATE TABLE email_events (
  id UUID PRIMARY KEY,
  sent_email_id UUID FK sent_emails,
  event_type VARCHAR(50),    -- "opened", "clicked", "bounced", "complained"
  event_timestamp TIMESTAMPTZ,
  event_data JSONB,          -- Dati raw dal provider
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Template Variables (Context)

**Booking Confirmation:**
```
- {{user_name}}
- {{user_email}}
- {{slot_name}}
- {{slot_date}}
- {{slot_time_start}}
- {{slot_time_end}}
- {{booking_confirmation_url}}
- {{app_url}}
- {{app_name}} (default: "Fortitudo Tennistavolo")
```

**Match Attendance Update:**
```
- {{user_name}}
- {{match_date}}
- {{match_time}}
- {{team_name}}
- {{opponent_name}}
- {{attendance_status}} ("Presente", "Assente", "Da Confermare")
- {{match_details_url}}
```

**Waiting List Promotion:**
```
- {{user_name}}
- {{slot_name}}
- {{slot_date}}
- {{slot_time}}
- {{book_confirmation_url}}
- {{expiry_time}} (link expire after 24h)
```

---

## Tracciamento Email

### Componenti

1. **Send Log**
   - Tabella `sent_emails` con timestamp, status, provider ID
   - Traccia ogni tentativo (fallimenti, retry)

2. **Webhook Listener**
   - Endpoint: `POST /api/webhooks/email/{provider}`
   - Riceve events da provider (delivered, opened, bounced, clicked)
   - Update `sent_emails.status` e inserisce in `email_events`

3. **Bounce Handling**
   - Hard bounce: disabilita email utente (flag in `profiles.email_verified = false`)
   - Soft bounce: retry automatico dopo 1h
   - Complained (spam): disabilita invio futuro a utente

4. **Dashboard Admin**
   - View: Email inviate (filtri: data, utente, template, status)
   - Stats: Total sent, delivered %, open rate, bounce rate
   - Graph: Trend invio email nel tempo

### Provider Webhooks

**Resend Webhook Events:**
```
POST /api/webhooks/email/resend
Body: {
  "type": "email.delivered" | "email.opened" | "email.clicked" | "email.bounced" | "email.complained",
  "created_at": "2026-09-06T...",
  "data": {
    "email_id": "...",
    "from": "...",
    "to": "...",
    ...
  }
}
```

**SendGrid Webhook Events:**
```
POST /api/webhooks/email/sendgrid
Body: [{
  "event": "delivered" | "open" | "click" | "bounce" | "spamreport",
  "timestamp": 1234567890,
  "email": "...",
  "smtp-id": "...",
  ...
}]
```

---

## Admin UI Design

### Pagina 1: Email Templates

**Path:** `/admin/notifiche/template`

**Tabella Template:**
```
| Nome Template | Oggetto | Stato | Versioni | Azioni |
|---------------|---------|-------|----------|--------|
| booking_confirmation | Conferma Prenotazione {{slot_name}} | Attivo | v2 | ✏️ 👁️ 📋 |
| match_attendance | Aggiornamento Presenze {{match_date}} | Attivo | v1 | ✏️ 👁️ 📋 |
| waiting_list_promotion | Posto Disponibile {{slot_name}} | Draft | v1 | ✏️ 👁️ 📋 |
```

**Azioni:**
- ✏️ **Modifica:** Form HTML editor con preview
- 👁️ **Anteprima:** Mostra email renderizzata (mock data)
- 📋 **Versioni:** Storico versioni + restore

### Pagina 2: Editor Template

**Form:**
```
Nome Template: [booking_confirmation] (read-only se versione > 1)

Oggetto Email: [Conferma Prenotazione {{slot_name}}]
             (autocomplete variabili disponibili)

Corpo Email: [HTML EDITOR con toolbar]
            - Bold, Italic, Link
            - Insert Variable (dropdown)
            - Preview pane (right side)

Preview Data (per test):
  user_name: Mario Rossi
  slot_name: Allenamento Lunedì
  slot_date: 05/09/2026
  ...

Stato: [Draft / Active] (dropdown)

[🔵 Salva] [Anteprima] [Annulla]
```

**HTML Editor Features:**
- Syntax highlighting
- Insert template variables via dropdown
- Inline CSS support (auto-converted to style attr)
- Responsive design hints
- Mobile preview

### Pagina 3: Storico Invio Email

**Path:** `/admin/notifiche/cronologia`

**Filtri:**
- Data (da/a)
- Utente (ricerca)
- Template
- Status: Sent / Delivered / Opened / Bounced / Failed
- Provider

**Tabella:**
```
| Data | A | Template | Oggetto | Status | Provider | Azioni |
|------|---|----------|---------|--------|----------|--------|
| 05/09 15:30 | mario@ex.com | booking_confirmation | Conferma | ✅ Delivered | resend | 👁️ 📊 |
| 04/09 12:00 | elena@ex.com | match_attendance | Aggiornamento | ⚠️ Bounced | resend | 👁️ |
```

**Azioni:**
- 👁️ **Visualizza:** Mostra HTML come è stato inviato + variabili usate
- 📊 **Events:** Mostra timeline (sent → delivered → opened)

### Pagina 4: Statistiche Email

**Path:** `/admin/notifiche/statistiche`

**Card 1: KPI Globali**
```
Total Sent (questo mese): 145
Delivered: 142 (97.9%)
Bounced: 2 (1.4%)
Complained: 1 (0.7%)
Open Rate: 34%
Click Rate: 8%
```

**Card 2: Per Template**
```
| Template | Sent | Delivered | Open Rate | Click Rate |
|----------|------|-----------|-----------|------------|
| booking_confirmation | 80 | 79 (98.7%) | 42% | 12% |
| match_attendance | 45 | 43 (95.5%) | 22% | 3% |
| waiting_list_promotion | 20 | 20 (100%) | 55% | 25% |
```

**Card 3: Trend Mensile (Grafico)**
```
[Grafico lineare: mese → total sent, delivered, opened]
```

**Card 4: Bounce Analysis**
```
Hard Bounce: 5 email
- mario@typo.com (invalid domain)
- test@test (invalid)

Soft Bounce: 3 email
- elena@ex.com (mailbox full)
- ...
```

---

## Piano Implementazione

### Fase 1: Setup Provider + Base Infrastructure (Settimana 1-2)

**Task:**
1. Scegli provider: **Resend** (consigliato)
2. Registra account + genera API key
3. Setup `.env.local`: `RESEND_API_KEY`
4. Test send manuale:
   ```bash
   npx resend send --to test@example.com --subject "Test"
   ```

**Deliverable:**
- ✅ Account attivo su provider
- ✅ Email test ricevuta
- ✅ API key configurata in Vercel
- ✅ Nodemailer o Resend SDK installato

**Timeline:** 1-2 giorni

---

### Fase 2: Database Schema + Logging (Settimana 2)

**Migration:** `0038_email_templates_and_logging.sql`

**Task:**
1. Crea tabelle:
   - `email_templates`
   - `email_template_versions`
   - `sent_emails`
   - `email_events`

2. Inserisci template base:
   - `booking_confirmation`
   - `match_attendance`
   - `waiting_list_promotion`

3. RLS policies:
   - Admin: CRUD template
   - Superadmin: View all stats
   - Utenti: nessun accesso

**Deliverable:**
- ✅ Migration applicata
- ✅ Template di default inseriti
- ✅ RLS configurato
- ✅ SQL test queries funzionano

**Timeline:** 2-3 giorni

---

### Fase 3: Backend Email Service + Webhook Listener (Settimana 3)

**Files:**
- `src/lib/actions/email.ts` — Server actions per invio
- `src/lib/supabase/email.ts` — Query funzioni
- `src/app/api/email/send/route.ts` — API endpoint per manual send
- `src/app/api/webhooks/email/[provider]/route.ts` — Webhook listener

**Task:**
1. Crea email service:
   ```typescript
   async function sendEmail(
     recipient: string,
     templateName: string,
     variables: Record<string, any>,
     userId?: string
   )
   ```

2. Logga in `sent_emails`:
   - recipient, template, provider_id, timestamp, status

3. Implementa webhook listener:
   - Ricevi events da Resend
   - Update status in `sent_emails`
   - Insert in `email_events`

4. Bounce handling:
   - Hard bounce: update profiles.email_bounced = true
   - Soft bounce: queue retry dopo 1h

5. Template rendering:
   - Replace variabili in soggetto e corpo
   - Validate variabili richieste presenti

**Deliverable:**
- ✅ Email service funzionante
- ✅ Logging in DB
- ✅ Webhook riceve events
- ✅ Status tracking aggiornato
- ✅ Test manuale con mock data

**Timeline:** 4-5 giorni

---

### Fase 4: Admin Pages - Template Management (Settimana 4)

**Pages:**
- `src/app/admin/notifiche/template/page.tsx` — Lista template
- `src/app/admin/notifiche/template/[templateId]/page.tsx` — Editor

**Task:**
1. Lista template (tabella):
   - CRUD per template
   - Ver versioni
   - Test send

2. Editor template:
   - HTML editor (textarea + toolbar)
   - Preview pane in real-time
   - Variable picker (dropdown)
   - Mobile preview
   - Salva come draft/active

3. Test send:
   - Input email test
   - Mock data per variabili
   - Invia tramite provider
   - Mostra result

**Components:**
- `TemplateList` — Tabella template
- `TemplateEditor` — HTML editor con preview
- `TemplateVersions` — Storico versioni
- `EmailPreview` — Anteprima responsive

**Server Actions:**
- `saveTemplate(formData)` — Save/update template
- `publishTemplate(templateId)` — Attiva template
- `testSendEmail(templateId, testEmail)` — Invio test
- `restoreTemplateVersion(versionId)` — Restore versione

**Deliverable:**
- ✅ Pagina lista template
- ✅ Editor HTML funzionante
- ✅ Preview in tempo reale
- ✅ CRUD completo
- ✅ Test send funziona

**Timeline:** 5-6 giorni

---

### Fase 5: Admin Pages - Email History + Stats (Settimana 5)

**Pages:**
- `src/app/admin/notifiche/cronologia/page.tsx` — Storico invio
- `src/app/admin/notifiche/statistiche/page.tsx` — KPI e analytics

**Task:**
1. Cronologia email:
   - Tabella sent_emails con filtri
   - Status icons (sent, delivered, opened, bounced)
   - Click per visualizzare HTML inviato
   - Timeline events

2. Statistiche:
   - Card KPI (sent, delivered, open rate, ecc)
   - Trend mensile (grafico)
   - Stats per template
   - Bounce analysis

**Components:**
- `EmailHistoryTable` — Tabella cronologia
- `EmailPreviewModal` — Popup HTML inviato
- `EmailEventTimeline` — Timeline deliver/open/click
- `StatsCards` — KPI cards
- `EmailChart` — Trend grafico
- `BounceAnalysis` — Analisi rimbalzi

**Queries:**
- `getEmailsHistory()` — Con filtri/pagination
- `getEmailStats()` — KPI aggregati
- `getEmailStatsByTemplate()` — Stats per template
- `getEmailEvents()` — Events timeline

**Deliverable:**
- ✅ Cronologia email filtrata
- ✅ Stats dashboard completo
- ✅ Grafico trend
- ✅ Bounce handling visibile

**Timeline:** 4-5 giorni

---

### Fase 6: Email Triggers - Integration con Features (Settimana 6-7)

**Trigger da Integrare:**

1. **Booking Confirmation** (on prenotazione creata)
   - Event: `INSERT bookings`
   - Template: `booking_confirmation`
   - Recipients: utente prenotato

2. **Reminder 24h** (cron job)
   - Schedule: Daily 09:00
   - Query: Prenotazioni domani
   - Template: `booking_reminder_24h`

3. **Match Attendance Update** (on cambio presenze admin)
   - Event: `UPDATE championship_match_attendances`
   - Template: `match_attendance`
   - Recipients: tutti giocatori squadra

4. **Waiting List Promotion** (on cancellazione)
   - Event: `DELETE bookings` (via trigger PostgreSQL)
   - Template: `waiting_list_promotion`
   - Recipients: first in waiting list
   - Features: Link scade dopo 24h

**Implementation:**
- Database trigger per booking confirmation
- Cron job per reminder 24h
- Server action per match attendance
- Database trigger per waiting list

**Deliverable:**
- ✅ Email inviata su booking
- ✅ Reminder 24h (cron funziona)
- ✅ Match attendance notifiche
- ✅ Waiting list auto-promotion

**Timeline:** 6-7 giorni

---

### Fase 7: Testing + Polish (Settimana 8)

**Task:**
1. Integration test:
   - Crea booking → email inviata ✅
   - Modifica presenze → email inviata ✅
   - Waiting list promotion → email inviata ✅

2. QA:
   - Spam filtering (check inbox + spam folder)
   - Mobile rendering (check in Outlook, Gmail mobile)
   - Link tracking (click e verify webhook)
   - Bounce handling

3. Documentazione:
   - README: Email notification setup
   - Admin guide: Come gestire template
   - Troubleshooting: Email non recapitate

**Deliverable:**
- ✅ Tutti test passed
- ✅ Documentazione completa
- ✅ Production ready
- ✅ Monitoring in place

**Timeline:** 3-4 giorni

---

## Riepilogo Tempi

| Fase | Task | Timeline | Notes |
|------|------|----------|-------|
| 1 | Setup Provider | 1-2 giorni | Resend account setup |
| 2 | DB Schema | 2-3 giorni | 4 tabelle + migration |
| 3 | Backend Service | 4-5 giorni | Email + webhook + bounce |
| 4 | Admin Template Mgmt | 5-6 giorni | Editor HTML + preview |
| 5 | Admin Stats | 4-5 giorni | Cronologia + KPI |
| 6 | Email Triggers | 6-7 giorni | Integration con features |
| 7 | Testing + Polish | 3-4 giorni | QA + docs |
| | **TOTALE** | **~4-5 settimane** | Full email notification system |

---

## Prossimi Step (Quando Pronti a Sviluppare)

1. ✅ **Valuta Providers:** Confronta Resend vs SendGrid
2. ✅ **Registra Account:** Crea account su provider scelto
3. ✅ **Setup Keys:** Aggiungi API key in Vercel
4. ✅ **Migration DB:** Crea `0038_email_templates_and_logging.sql`
5. ✅ **Email Service:** Implementa `src/lib/actions/email.ts`
6. ✅ **Admin Pages:** Crea `/admin/notifiche/*`
7. ✅ **Integration:** Collega booking/match triggers
8. ✅ **Testing:** QA completo
9. ✅ **Deploy:** Production v1.1.0

---

## Considerazioni di Sicurezza

### SMTP Credentials
- ✅ Mai committare credenziali in git
- ✅ Usare `.env.local` (gitignored)
- ✅ Vercel Environment Variables per produzione
- ✅ Rotate keys periodicamente

### Template HTML
- ✅ Sanitize variabili (XSS prevention)
- ✅ Valida HTML before save (optional)
- ✅ Rate limit email send (prevent abuse)
- ✅ Log tutti gli invii (audit trail)

### Bounce Management
- ✅ Hard bounce: disable email user
- ✅ Soft bounce: retry logic
- ✅ Complained (spam): permanent disable
- ✅ Monitor bounce rate (>5% = alert admin)

### Privacy
- ✅ GDPR: email consent tracking
- ✅ Unsubscribe link in footer (best practice)
- ✅ Data retention: delete sent_emails dopo 90 giorni (opzionale)

---

**Documento Creato:** 2026-09-06  
**Status:** 🟢 Esplorazione Completa — Pronto per Sviluppo Futuro  
**Prossima Fase:** Quando team decide di implementare, seguire piano fase per fase
