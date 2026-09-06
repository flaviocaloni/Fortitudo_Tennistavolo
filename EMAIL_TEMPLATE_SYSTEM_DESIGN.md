# Email Template System — Detailed Design

Documento di progettazione per il sistema di template HTML responsive email, coerente con CSS app.

---

## 📋 Indice

1. [Design Principi](#design-principi)
2. [HTML Email Best Practices](#html-email-best-practices)
3. [Template di Base (Boilerplate)](#template-di-base-boilerplate)
4. [Template Disponibili](#template-disponibili)
5. [CSS Responsive Pattern](#css-responsive-pattern)
6. [Variable Substitution](#variable-substitution)
7. [Mobile Preview](#mobile-preview)
8. [Accessibilità](#accessibilità)

---

## Design Principi

### 1. Coerenza Brand

**Colori (da app Tailwind):**
- Primary: `#0EA5E9` (sky-500) — CTA buttons
- Success: `#10B981` (emerald-500) — Confirmations
- Warning: `#F59E0B` (amber-500) — Alerts
- Danger: `#EF4444` (red-500) — Errors
- Neutral: `#6B7280` (gray-500) — Body text

**Font:**
- Heading: "Segoe UI", Tahoma, Geneva, sans-serif
- Body: "Segoe UI", Tahoma, Geneva, sans-serif
- Size: 14px body, 18px heading (readable on mobile)

### 2. Responsive Design

**Pattern:** Mobile-first → Desktop
- Base: 320px (mobile)
- Tablet: 600px
- Desktop: 800px

**Media Query Mobile:**
```css
@media (max-width: 600px) {
  width: 100% !important;
  max-width: 100% !important;
  padding: 20px 15px !important;
}
```

### 3. Inline CSS Only

**Motivo:**
- Email clients non supportano `<style>` o `<link>`
- Deve essere tutto inline `style="..."`

**Helper per Admin:**
- Template editor auto-convert `<style>` → inline
- Oppure: Usa biblioteca `juice` (CSS inliner)

### 4. Table-Based Layout

**Motivo:**
- Compatibilità massima Outlook (20+ anni)
- `<div>` non funziona bene in certi client

**Pattern:**
```html
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>Content</td>
  </tr>
</table>
```

### 5. Alt Text per Images

**Tutti gli `<img>` devono avere `alt`:**
```html
<img src="..." alt="Logo Fortitudo" width="200" height="60" />
```

### 6. No JavaScript

**Email non supporta:**
- ❌ `<script>`
- ❌ Event listeners
- ❌ CSS animations (mostly)

**Solo:**
- ✅ HTML strutturale
- ✅ Inline CSS
- ✅ Track pixel per open rate

---

## HTML Email Best Practices

### 1. Doctype & Encoding

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fortitudo — Conferma Prenotazione</title>
</head>
<body>
  ...
</body>
</html>
```

### 2. Wrapper Table

**Sempre racchiudere in wrapper:**
```html
<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:20px;">
        <!-- Content -->
      </td>
    </tr>
  </table>
</body>
```

### 3. Non Usare

```html
<!-- ❌ Evita: -->
<div style="width:600px;">              <!-- Non responsive -->
<style> h1 { color: red; } </style>     <!-- Non supportato -->
<script>alert('hi')</script>            <!-- Non supportato -->
background: url(...)                    <!-- Spesso bloccato -->
```

### 4. Usa

```html
<!-- ✅ Preferisci: -->
<table width="600" style="max-width:100%;">  <!-- Responsive -->
<table role="presentation">                   <!-- Accessibility -->
<img src="..." alt="description" />          <!-- Alt text -->
<a href="{{button_url}}" style="...">        <!-- Inline style -->
```

### 5. Test Clients

**Email clients da testare (in ordine priorità):**
1. **Gmail** (50% utenti)
2. **Outlook** (25%)
3. **Apple Mail** (15%)
4. **Mobile: Gmail, Outlook app** (10%)

**Tool:** Litmus, Email on Acid (free alternatives: browser extensions)

---

## Template di Base (Boilerplate)

### Struttura Standard

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{email_subject}}</title>
  <style>
    /* Inline CSS will be auto-converted to style attributes */
    body {
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", Tahoma, Geneva, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .header {
      background-color: #0EA5E9;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    
    .content {
      padding: 30px 20px;
      line-height: 1.6;
    }
    
    .button {
      display: inline-block;
      background-color: #0EA5E9;
      color: white;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      margin: 20px 0;
    }
    
    .footer {
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 20px 15px !important; }
      .content { padding: 20px 15px !important; }
      .button { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body>
  <div style="background-color:#f3f4f6; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" 
           style="max-width:600px; margin:0 auto; background-color:#ffffff; 
                  border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color:#0EA5E9; color:white; padding:30px 20px; text-align:center;">
          <img src="{{logo_url}}" alt="Fortitudo" width="120" height="40" 
               style="max-width:100%; height:auto;">
          <h1 style="margin:15px 0 0; font-size:24px; font-weight:bold;">
            {{email_title}}
          </h1>
        </td>
      </tr>
      
      <!-- CONTENT -->
      <tr>
        <td style="padding:30px 20px; line-height:1.6; color:#1f2937;">
          {{email_body}}
        </td>
      </tr>
      
      <!-- CTA BUTTON (Optional) -->
      <tr>
        <td style="padding:0 20px 20px;">
          <a href="{{cta_url}}" style="display:inline-block; background-color:#0EA5E9; 
             color:white; padding:12px 30px; border-radius:6px; text-decoration:none; 
             font-weight:500;">
            {{cta_button_text}}
          </a>
        </td>
      </tr>
      
      <!-- DIVIDER -->
      <tr>
        <td style="padding:0 20px;">
          <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;">
        </td>
      </tr>
      
      <!-- FOOTER -->
      <tr>
        <td style="background-color:#f3f4f6; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
          <p style="margin:0;">{{footer_text}}</p>
          <p style="margin:10px 0 0;">
            <a href="{{unsubscribe_url}}" style="color:#0EA5E9; text-decoration:none;">
              Annulla iscrizione
            </a>
          </p>
        </td>
      </tr>
    </table>
  </div>
  
  <!-- TRACKING PIXEL (Open Rate) -->
  <img src="{{tracking_pixel_url}}" width="1" height="1" alt="" style="display:none;">
</body>
</html>
```

---

## Template Disponibili

### Template 1: Booking Confirmation

**Nome:** `booking_confirmation`  
**Trigger:** Dopo creazione prenotazione  
**Recipient:** Utente che si è prenotato

**Variabili:**
```
- {{user_first_name}}        # "Mario"
- {{user_full_name}}         # "Mario Rossi"
- {{slot_name}}              # "Allenamento Lunedì"
- {{slot_date}}              # "05/09/2026"
- {{slot_time_start}}        # "19:00"
- {{slot_time_end}}          # "20:30"
- {{slot_location}}          # "Palestra X, Via Roma 123"
- {{booking_confirmation_url}} # Link a /prenotazioni
- {{cancel_booking_url}}     # Link per cancellare
- {{app_url}}                # https://fortitudo-tennistavolo.vercel.app
- {{app_name}}               # "Fortitudo Tennistavolo"
```

**HTML Template:**
```html
<!-- [Usa boilerplate di base] -->
<h2 style="color:#10B981; margin-top:0;">✅ Prenotazione Confermata!</h2>

<p>Ciao {{user_first_name}},</p>
<p>La tua prenotazione è stata registrata con successo!</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; 
       border:1px solid #e5e7eb; border-radius:6px;">
  <tr style="background-color:#f9fafb;">
    <td style="padding:15px; border-right:1px solid #e5e7eb; font-weight:bold;">
      Allenamento
    </td>
    <td style="padding:15px;">
      {{slot_name}}
    </td>
  </tr>
  <tr>
    <td style="padding:15px; border-right:1px solid #e5e7eb; font-weight:bold;">
      Data
    </td>
    <td style="padding:15px;">
      {{slot_date}}
    </td>
  </tr>
  <tr style="background-color:#f9fafb;">
    <td style="padding:15px; border-right:1px solid #e5e7eb; font-weight:bold;">
      Ora
    </td>
    <td style="padding:15px;">
      {{slot_time_start}} - {{slot_time_end}}
    </td>
  </tr>
  <tr>
    <td style="padding:15px; border-right:1px solid #e5e7eb; font-weight:bold;">
      Luogo
    </td>
    <td style="padding:15px;">
      {{slot_location}}
    </td>
  </tr>
</table>

<p>
  <a href="{{booking_confirmation_url}}" 
     style="display:inline-block; background-color:#0EA5E9; color:white; 
            padding:12px 30px; border-radius:6px; text-decoration:none; font-weight:500;">
    Visualizza Prenotazione
  </a>
</p>

<p>Se necessiti cancellare, puoi farlo direttamente dall'app entro 24 ore.</p>

<p style="color:#6b7280; font-size:14px;">
  A presto,<br>
  {{app_name}} 🏓
</p>
```

---

### Template 2: Booking Reminder 24h

**Nome:** `booking_reminder_24h`  
**Trigger:** Cron job (daily 09:00 UTC)  
**Recipient:** Chi ha prenotazione domani

**Variabili:**
```
- {{user_first_name}}
- {{slot_name}}
- {{slot_date}}
- {{slot_time_start}}
- {{slot_time_end}}
- {{slot_location}}
- {{my_bookings_url}}  # Link a /prenotazioni
```

**HTML:**
```html
<h2 style="color:#F59E0B;">⏰ Promemoria: Allenamento Domani</h2>

<p>Ciao {{user_first_name}},</p>

<p>Domani hai un allenamento in programma!</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; 
       background-color:#FEF3C7; border-left:4px solid #F59E0B; padding:15px; border-radius:4px;">
  <tr>
    <td>
      <strong>{{slot_name}}</strong><br>
      {{slot_date}} ore {{slot_time_start}}<br>
      {{slot_location}}
    </td>
  </tr>
</table>

<p>
  <a href="{{my_bookings_url}}" 
     style="display:inline-block; background-color:#0EA5E9; color:white; 
            padding:12px 30px; border-radius:6px; text-decoration:none; font-weight:500;">
    Vai alle Mie Prenotazioni
  </a>
</p>

<p>Vedi presto! 🏓</p>
```

---

### Template 3: Match Attendance Notification

**Nome:** `match_attendance`  
**Trigger:** Quando admin modifica presenze campionato  
**Recipient:** Giocatori della squadra

**Variabili:**
```
- {{user_first_name}}
- {{match_date}}
- {{match_time_start}}
- {{team_name}}
- {{opponent_name}}
- {{venue_name}}
- {{your_attendance_status}}  # "Presente", "Assente", "Da Confermare"
- {{match_details_url}}
- {{update_attendance_url}}
```

**HTML:**
```html
<h2 style="color:#0EA5E9;">🏆 Aggiornamento Presenze Partita</h2>

<p>Ciao {{user_first_name}},</p>

<p>L'admin ha aggiornato le presenze per la prossima partita:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; 
       border:1px solid #e5e7eb; border-radius:6px;">
  <tr style="background-color:#0EA5E9; color:white;">
    <td style="padding:15px; font-weight:bold; font-size:16px;">
      {{team_name}} vs {{opponent_name}}
    </td>
  </tr>
  <tr>
    <td style="padding:15px;">
      📅 {{match_date}} ore {{match_time_start}}<br>
      📍 {{venue_name}}
    </td>
  </tr>
  <tr style="background-color:#f9fafb;">
    <td style="padding:15px;">
      <strong>Il Tuo Status:</strong><br>
      <span style="display:inline-block; padding:5px 10px; border-radius:4px; 
            background-color:{% if your_attendance_status == 'Presente' %}#10B981{% elif your_attendance_status == 'Assente' %}#EF4444{% else %}#F59E0B{% endif %}; 
            color:white;">
        {{your_attendance_status}}
      </span>
    </td>
  </tr>
</table>

<p>
  <a href="{{match_details_url}}" 
     style="display:inline-block; background-color:#0EA5E9; color:white; 
            padding:12px 30px; border-radius:6px; text-decoration:none; font-weight:500;">
    Visualizza Dettagli Partita
  </a>
</p>
```

---

### Template 4: Waiting List Promotion

**Nome:** `waiting_list_promotion`  
**Trigger:** Auto-promotion quando si libera un posto  
**Recipient:** First in waiting list  
**Urgency:** Link scade dopo 24h

**Variabili:**
```
- {{user_first_name}}
- {{slot_name}}
- {{slot_date}}
- {{slot_time_start}}
- {{slot_time_end}}
- {{confirm_booking_url}}  # Link con token, scade 24h
- {{expiry_time}}          # "24 ore"
```

**HTML:**
```html
<h2 style="color:#10B981;">🎉 Posto Disponibile!</h2>

<p>Ciao {{user_first_name}},</p>

<p>Un posto si è liberato! Sei primo/a in lista d'attesa:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; 
       background-color:#DBEAFE; border:2px solid #0EA5E9; border-radius:6px; padding:15px;">
  <tr>
    <td>
      <strong style="font-size:18px;">{{slot_name}}</strong><br>
      {{slot_date}} ore {{slot_time_start}} - {{slot_time_end}}<br>
      <span style="color:#6b7280; font-size:14px;">Tempo disponibile: {{expiry_time}}</span>
    </td>
  </tr>
</table>

<p style="color:#DC2626; font-weight:bold;">
  ⚠️ Questo link scade tra {{expiry_time}}. Conferma subito!
</p>

<p>
  <a href="{{confirm_booking_url}}" 
     style="display:inline-block; background-color:#10B981; color:white; 
            padding:12px 30px; border-radius:6px; text-decoration:none; font-weight:500; 
            font-size:16px;">
    ✅ Confermo la Prenotazione
  </a>
</p>

<p style="color:#6b7280; font-size:14px;">
  Se non clicchi entro {{expiry_time}}, il posto verrà offerto al prossimo in lista.
</p>
```

---

## CSS Responsive Pattern

### Media Query Strategy

**Mobile-First (320px+):**
```css
/* Base styles for mobile */
.container { width: 100%; padding: 15px; }
.button { width: 100%; display: block; }

/* Tablet (600px+) */
@media (min-width: 600px) {
  .container { width: 100%; max-width: 600px; }
  .button { width: auto; display: inline-block; }
}

/* Desktop (800px+) - Email not really needed, for preview */
@media (min-width: 800px) {
  .container { max-width: 600px; }
}
```

### Inline Style Best Practices

```html
<!-- ✅ Usa style attribute inline -->
<table width="100%" cellpadding="0" cellspacing="0" 
       style="max-width:600px; margin:0 auto; border-collapse:collapse;">

<!-- ✅ Usa height/width HTML attributes -->
<img src="logo.png" width="200" height="60" alt="Logo">

<!-- ✅ Usa max-width per scalare su mobile -->
<img src="banner.png" style="max-width:100%; height:auto;" alt="Banner">

<!-- ❌ Evita: Dipende da viewport width -->
<div style="width:800px;">Troppo largo!</div>

<!-- ✅ Usa: 100% + max-width -->
<div style="width:100%; max-width:600px;">Perfetto!</div>
```

---

## Variable Substitution

### Implementazione Backend

```typescript
// Template engine: Handlebars syntax
function renderTemplate(templateHtml: string, variables: Record<string, any>): string {
  let html = templateHtml;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, String(value || ''));
  }
  
  return html;
}

// Esempio
const html = renderTemplate(bookingConfirmationTemplate, {
  user_first_name: 'Mario',
  slot_name: 'Allenamento Lunedì',
  slot_date: '05/09/2026',
  // ...
});
```

### Validazione Variabili

```typescript
// Controlla che tutte le variabili richieste siano presenti
function validateTemplate(templateHtml: string, providedVars: string[]): ValidationResult {
  const requiredVars = templateHtml.match(/{{(\w+)}}/g) || [];
  const required = new Set(requiredVars.map(v => v.slice(2, -2)));
  const provided = new Set(providedVars);
  
  const missing = [...required].filter(v => !provided.has(v));
  
  return {
    isValid: missing.length === 0,
    missingVariables: missing,
    message: missing.length > 0 
      ? `Variabili mancanti: ${missing.join(', ')}`
      : 'Template valido'
  };
}
```

### Escape HTML

```typescript
// Escape variabili per sicurezza (XSS prevention)
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Usa nella sostituzione:
html = html.replace(
  new RegExp(`{{${key}}}`, 'g'), 
  escapeHtml(String(value || ''))
);
```

---

## Mobile Preview

### Preview Size Targets

**Desktop:** 600px (standard email width)  
**Tablet:** 480px  
**Mobile:** 320px (iPhone SE), 375px (iPhone), 414px (iPhone Plus)

### Admin Preview UI

```html
<!-- Fornire 3 view size nel template editor -->
<div class="preview-sizes">
  <button data-size="320">📱 Mobile</button>
  <button data-size="480">📱 Tablet</button>
  <button data-size="600">🖥️ Desktop</button>
</div>

<!-- Preview container responsive -->
<div class="preview-container" style="width:320px;">
  <iframe 
    id="preview-frame"
    srcDoc="{{rendered_html}}"
    style="width:100%; border:1px solid #ddd;"
  />
</div>

<!-- JavaScript per cambiar size -->
<script>
document.querySelectorAll('[data-size]').forEach(btn => {
  btn.onclick = () => {
    const container = document.querySelector('.preview-container');
    container.style.width = btn.dataset.size + 'px';
  };
});
</script>
```

---

## Accessibilità

### Best Practices

1. **Alt Text per Immagini:**
   ```html
   <img src="..." alt="Descrizione significativa" />
   ```

2. **Semantic HTML:**
   ```html
   <table role="presentation">  <!-- Screen readers: not table data -->
   <h1>, <h2>, <h3>             <!-- Heading hierarchy -->
   <strong>, <em>               <!-- Instead of <b>, <i> -->
   ```

3. **Color Contrast:**
   - ✅ Minimo WCAG AA: 4.5:1 ratio
   - Usa tool: webaim.org/resources/contrastchecker

4. **Link Testo:**
   ```html
   <!-- ❌ Evita: -->
   <a href="#">Clicca qui</a>
   
   <!-- ✅ Usa: -->
   <a href="{{url}}">Visualizza Prenotazione</a>
   ```

5. **Font Size:**
   - ✅ Minimo 14px per body text
   - ✅ Minimo 16px per mobile (auto-zoom iOS)

---

## Prossimi Step (Implementazione)

1. **Scegli Provider:** Resend o SendGrid (vedi EMAIL_DELIVERY_EXPLORATION.md)
2. **Crea Tabelle DB:** Migration per `email_templates`, `sent_emails`
3. **Implementa Template Base:** Usa boilerplate di questo documento
4. **Build Admin UI:** Editor HTML + preview
5. **Testa** su: Gmail, Outlook, Apple Mail, Mobile

---

**Documento Creato:** 2026-09-06  
**Status:** 🟢 Design Completo — Pronto per Implementazione  
**Next:** Quando team pronto, seguire piano in EMAIL_DELIVERY_EXPLORATION.md
