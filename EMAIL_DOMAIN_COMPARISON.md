# Email Domain Comparison — Gmail vs Dominio Aziendale

Documento di analisi comparativa tra le due strategie di invio email per Fortitudo Tennistavolo.

---

## 📋 Indice

1. [Scenario Attuale: Gmail](#scenario-attuale-gmail)
2. [Scenario Alternativo: Dominio Aziendale](#scenario-alternativo-dominio-aziendale)
3. [Confronto Diretto](#confronto-diretto)
4. [Impatto Tecnico](#impatto-tecnico)
5. [Impatto Economico](#impatto-economico)
6. [Timeline Implementazione](#timeline-implementazione)
7. [Raccomandazione](#raccomandazione)

---

## Scenario Attuale: Gmail

**Descrizione:** Email notifications inviate da `noreply@fortitudo.it` (alias Gmail) oppure da casella personale `admin@gmail.com`

### Setup Tecnico

```
Provider Email: Gmail (SMTP)
From Address: noreply@fortitudo.it (alias) → tue@gmail.com
Domain: Gmail (google.com)
Authentication: App Password
Reputation: Gmail (condivisa con milioni utenti)
Compliance: Basic (no SPF/DKIM/DMARC necessari)
```

### Pro ✅

- **Costo:** €0 (gratis)
- **Setup Veloce:** 10 minuti
- **No Admin Domain:** Niente da gestire
- **Familiar:** Gmail interface
- **Affidabile per Volume Basso:** 500 email/giorno sufficiente
- **No Renewal:** No scadenza domini
- **Privacy:** No WHOIS pubblico

### Contro ❌

- **Reputazione Gmail:** Condivisa con milioni
- **Spam Folder Risk:** Email può finire in spam
- **Limite Volume:** 500/giorno insufficiente se cresce
- **Account Lock Risk:** Google può bloccare per volume
- **SPF/DKIM/DMARC:** Non configurabili (Gmail property)
- **Brand Weakness:** "noreply@fortitudo.it sent from Gmail account"
- **No Custom Header:** "via mail-xxx.google.com"
- **Bounce Tracking:** Limitato (no webhook nativo)
- **Professional Image:** Meno professionale

### Email Visualization

```
From: Fortitudo Tennistavolo <noreply@fortitudo.it>
Reply-To: (non configurabile bene)
Return-Path: tue+bounce@gmail.com  ← Gmail, non fortitudo.it
X-Mailer: Gmail
X-Originating-IP: [Google IP]
```

**In Gmail Recipient:**
```
From: Fortitudo Tennistavolo [via mail-xxx.google.com ← Problema]
```

---

## Scenario Alternativo: Dominio Aziendale

**Descrizione:** Email notifications inviate da `noreply@fortitudo.it` con dominio proprio + provider esterno (SendGrid, Resend, SES)

### Setup Tecnico

```
Provider Email: Resend (o SendGrid, SES)
From Address: noreply@fortitudo.it
Domain: Proprio fortitudo.it (registrato)
Authentication: API Key + SMTP
Reputation: Provider (Resend, SendGrid)
Compliance: SPF + DKIM + DMARC configurabili
```

### Pro ✅

- **Reputazione Provider:** SendGrid/Resend = eccellente (non Gmail)
- **Deliverability:** Email arriva (non spam) → 95%+
- **Brand Identity:** "From: noreply@fortitudo.it" (vostro dominio)
- **SPF/DKIM/DMARC:** Completo controllo
- **Professional:** Email vera aziendale
- **Volume Illimitato:** Paid tier scalabile
- **Webhook Events:** Tracking completo (delivered, opened, clicked, bounced)
- **Compliance:** GDPR, CAN-SPAM supportato
- **Custom Headers:** Personalizz abili
- **Analytics:** Dashboard provider con stats
- **No Account Lock:** Provider garantisce uptime

### Email Visualization

```
From: Fortitudo Tennistavolo <noreply@fortitudo.it>
Reply-To: info@fortitudo.it
Return-Path: bounce.xxx@fortitudo.it  ← Vostro dominio!
X-Mailer: Resend
X-Originating-IP: [Resend IP]

SPF: ✅ pass (sendgrid.net)
DKIM: ✅ pass (fortitudo.it)
DMARC: ✅ pass (policy=reject)
```

**In Gmail Recipient:**
```
From: Fortitudo Tennistavolo <noreply@fortitudo.it>
✅ Authenticated (SPF + DKIM passed)
```

### Contro ❌

- **Costo Dominio:** €15-20/anno per .it
- **Costo Email:** €20-30/mese per volume produzione
- **Setup Complesso:** 2-3 ore (DNS, SPF, DKIM, DMARC)
- **Admin Overhead:** Gestione DNS records
- **Renewal:**Rinnovo dominio annuale
- **WHOIS Pubblico:** Registrazione dominio visibile (può essere privato per €5/anno)

---

## Confronto Diretto

### Tabella Comparativa

| Aspetto | Gmail | Dominio Aziendale |
|---------|-------|-------------------|
| **Setup Time** | 10 min | 2-3 ore |
| **Costo Iniziale** | €0 | €15-20 (dominio .it) |
| **Costo Mensile** | €0 | €20-30 (email provider) |
| **Costo Annuale** | €0 | €240-380 |
| **Email Deliverability** | ~70% (spam risk) | ~95%+ (eccellente) |
| **Reputation** | Gmail shared | SendGrid/Resend |
| **Volume Supportato** | 500/giorno | 50k+/mese (illimitato) |
| **SPF/DKIM/DMARC** | ❌ No | ✅ Sì |
| **Webhook Tracking** | ❌ Limitato | ✅ Completo |
| **Professional Image** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Admin Overhead** | Minimo | Medio |
| **Scalabilità** | Limitata | Illimitata |
| **Compliance GDPR** | Basic | Completo |
| **Brand Control** | Basso | Totale |

---

## Impatto Tecnico

### Implementazione Gmail

```typescript
// Environment
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  (App Password)

// Code
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

**Migrazione Futura:** Se passi a dominio aziendale
- Cambia SMTP_HOST, SMTP_USER, SMTP_PASSWORD
- Aggiorna DNS records (SPF, DKIM, DMARC)
- Nessun cambio codice (email service rimane stesso)
- Risk: Email client delivery cambia (potrebbero finire in spam durante transizione)

### Implementazione Dominio Aziendale

```typescript
// Environment
RESEND_API_KEY=re_xxx  (no SMTP necessario)
EMAIL_FROM=noreply@fortitudo.it

// Code
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@fortitudo.it',
  to: 'user@example.com',
  subject: 'Conferma Prenotazione',
  html: template
});
```

**DNS Setup Richiesto:**

```dns
# SPF Record (fortitudo.it)
v=spf1 include:sendgrid.net ~all

# DKIM Record (resend._domainkey.fortitudo.it)
v=DKIM1; k=rsa; p=MIGfMA0BgQ...  (generato da Resend)

# DMARC Record (_dmarc.fortitudo.it)
v=DMARC1; p=reject; rua=mailto:admin@fortitudo.it
```

---

## Impatto Economico

### Scenario 1: Gmail Only (No Dominio)

```
Setup: €0
Monthly: €0
Yearly: €0
TOTAL: €0

⚠️ Rischio: Se crescite (>500 email/giorno)
  → Cambiare a provider pagato (costo + downtime)
```

### Scenario 2: Dominio Aziendale + Resend

```
One-Time:
  - Dominio .it: €15 (registration) + €15/anno (renewal)
  - DNS setup: €0 (fai da solo)
  - Email provider setup: €0 (free tier prima)

Monthly (produzione):
  - Resend: €20/mese (50k email/mese)
  - Dominio: €1.25/mese (€15/anno)
  Total: €21.25/mese

Yearly:
  - Resend: €240/anno
  - Dominio: €15/anno
  TOTAL: €255/anno

Growth Path:
  - 50k email/mese: €20/mese (Resend)
  - 100k email/mese: €20/mese (same plan)
  - 500k email/mese: ~€80-100/mese
```

### Scenario 3: Dominio + SendGrid

```
Same as Resend, ma:
  - SendGrid free: 100/giorno (100 email/mese test)
  - SendGrid paid: $30/mese per 10k email/mese
  → Leggermente più caro di Resend, ma più stabile

Yearly: €360-400/anno
```

---

## Timeline Implementazione

### Path A: Gmail First, Dominio Later

**Fase 1 (Subito):** Email su Gmail
- Timeline: 1 settimana (setup provider + email service)
- Costo: €0
- Risk: Spam folder, volume limit

**Fase 2 (3-6 mesi dopo):** Migrazione a Dominio
- Timeline: 2 settimane (setup DNS + test)
- Costo: €255/anno (Resend + dominio)
- Downtime: ~1-2 giorni email re-routing
- Data loss: Nessuno (storico email rimane in DB)

### Path B: Dominio from Start

**Fase 1 (Subito):** Dominio + Provider
- Timeline: 2-3 settimane (registra dominio + setup DNS + email service)
- Costo: €255/anno
- Risk: Setup iniziale complesso, ma no migrazione dopo

---

## Impatto sul Modello di Implementazione (v1.1.0)

### Email Service (Comune a Entrambi)

```
src/lib/actions/email.ts
├─ sendEmail(to, template, variables, recipient_user_id)
│  ├─ Check template exists
│  ├─ Render template (substitute variables)
│  ├─ Send via provider (Gmail SMTP o Resend API)
│  └─ Log to sent_emails table
│
├─ handleEmailBounce(provider_event)
│  ├─ Parse webhook from Gmail/Resend
│  ├─ Update sent_emails.status
│  └─ Disable user email if hard bounce
│
└─ getEmailStats()
   └─ Query sent_emails, aggregate by template/status/date
```

**Differenza:** Solo endpoint iniziale cambia
- Gmail: SMTP setup + nodemailer
- Dominio: Resend SDK + DNS config

**Webhook Listener:**
- Gmail: No webhook nativo (polling required per status)
- Resend: Webhook listener pronto (POST /api/webhooks/email/resend)

### Database Schema

**Identico in entrambi scenari** — no cambiamenti

```sql
-- Funziona per Gmail e Dominio
email_templates
  ├─ name: "booking_confirmation"
  ├─ subject: "Conferma {{slot_name}}"
  ├─ html_body: "<html>..."
  ├─ variables: ["slot_name", "slot_date", ...]

sent_emails
  ├─ recipient_email
  ├─ template_name
  ├─ status: "sent", "delivered", "bounced"
  ├─ provider: "gmail_smtp" | "resend"
  ├─ provider_message_id: (optional)
```

### Admin UI

**Identico in entrambi scenari** — layout/features non cambiano

Differenza visibile:
- Gmail: "Via mail.google.com" footer
- Dominio: "Via fortitudo.it" (vostro dominio)

---

## Raccomandazione

### 🎯 Strategia Consigliata: **Ibrida (Gmail → Dominio)**

#### Fase 1 (v1.1.0 Launch): Gmail

**Motivi:**
- ✅ Time-to-market veloce (1 settimana)
- ✅ Costo zero iniziale
- ✅ Sufficiente per fase alpha (100 prenotazioni/settimana)
- ✅ Proof of concept email system

**Implementazione:**
- Provider: Gmail SMTP
- From: `noreply@fortitudo.it` (alias Gmail)
- Setup: 1 settimana
- Cost: €0

#### Fase 2 (v1.2.0, dopo 3-6 mesi): Dominio Aziendale

**Trigger:** Se/quando
- Volume cresce (>500 email/settimana)
- Email finiscono spesso in spam
- Vuoi professional branding
- Budget disponibile (€255/anno)

**Implementazione:**
- Registra dominio .it
- Setup DNS (SPF, DKIM, DMARC)
- Migra da Gmail a Resend
- Webhook listening attivo

**Migrazione Risk:**
- Low: Database schema identico
- Email service architecture reusa
- Downtime: ~1-2 ore durante cutover DNS

---

## Comparazione Finale

### Per Club Piccolo (50-100 prenotazioni/settimana)

**Raccomandazione: Gmail** (Path A Fase 1)

| Criterio | Gmail | Dominio |
|----------|-------|---------|
| Cost | ✅ €0 | ❌ €255/anno |
| Setup | ✅ 10 min | ❌ 2-3 ore |
| Volume | ✅ Enough (500/d) | ⭐⭐ Overkill |
| Branding | ❌ Weak | ✅ Strong |
| Professional | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Verdict:** Gmail sufficiente, migra dopo se needed

---

### Per Club Grande (>500 prenotazioni/settimana + Campionati)

**Raccomandazione: Dominio Aziendale** (Path B)

| Criterio | Gmail | Dominio |
|----------|-------|---------|
| Cost | ✅ €0 | ⭐ Worth it |
| Setup | ✅ Fast | ⭐⭐ Worth it |
| Volume | ❌ Risky | ✅ Unlimited |
| Branding | ❌ Weak | ✅ Strong |
| Professional | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Verdict:** Dominio investimento che vale

---

## Prossimi Step

### Se Scegli Gmail (Raccomandato Now)

1. Usa piano EMAIL_DELIVERY_EXPLORATION.md (Fase 1-7)
2. Setup SMTP Gmail
3. Implememnta email service
4. Test per 3-6 mesi
5. Prendi decisione su dominio basato su feedback

### Se Scegli Dominio Subito

1. Registra dominio .it (~€15)
2. Setup DNS records (SPF, DKIM, DMARC)
3. Registra account Resend
4. Aggiungi dominio a Resend console
5. Segui piano EMAIL_DELIVERY_EXPLORATION.md (adatta per Resend SDK)
6. Implementa email service
7. Configura webhook listener

### Migrazione Gmail → Dominio (Futuro)

1. Registra dominio .it
2. Setup DNS (SPF, DKIM, DMARC)
3. Switch provider (Resend)
4. Test send su audience piccolo (1 giorno)
5. Gradual rollout (10% → 50% → 100%)
6. Monitor bounce rate, spam complaints
7. Keep Gmail per backup (2 settimane)

---

## Considerazioni Finali

### Gmail ✅ Se

- Budget limitato (€0 vs €255/anno)
- Volume basso (prenotazioni/settimana < 500)
- Timeline tight (launch v1.1.0 in 1 week)
- Disposti a migrare dopo se needed
- Club piccolo/test phase

### Dominio ✅ Se

- Professional branding è prioritario
- Volume alto (>500 email/settimana)
- Budget disponibile (€255/anno)
- Compliance GDPR is critical
- Long-term vision (stabilità)
- Vuoi webhook/tracking completo

---

**Documento Creato:** 2026-09-06  
**Status:** 🟢 Analisi Comparativa Completa  
**Raccomandazione:** Gmail Phase 1, Dominio Phase 2 (3-6 mesi dopo)
