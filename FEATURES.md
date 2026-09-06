# Features Dettagliate — Versione 1.0.0

Documento completo di tutte le funzionalità implementate con esempi e istruzioni d'uso.

---

## 📋 Indice

1. [Autenticazione](#autenticazione)
2. [Gestione Stagioni](#gestione-stagioni)
3. [Slot e Calendario](#slot-e-calendario)
4. [Prenotazioni](#prenotazioni)
5. [Profilo Utente](#profilo-utente)
6. [Campionati](#campionati)
7. [Statistiche](#statistiche)
8. [Amministrazione Utenti](#amministrazione-utenti)

---

## Autenticazione

### Registrazione

**Pagina:** `/login` → Tab "Registrazione"

**Flusso:**
1. Email + Password
2. Seleziona Ruolo: **Agonista** (federato) o **Amatore** (ricreativo)
3. Compila nome, cognome, telefono
4. Conferma email
5. Accesso automatico

**Validazioni:**
- Email deve essere unica
- Password min 8 caratteri
- Email validato tramite Supabase Auth

### Login

**Opzioni:**
1. Email + Password (email verificata)

**Note:**
- Sessione persiste 7 giorni (default Supabase)
- Logout disponibile nel menu navbar
- Recupero password via email

### Ruoli Iniziali

- **Agonista:** Registrazione self-service
- **Amatore:** Registrazione self-service
- **Admin:** Creato manualmente via SQL da superadmin
- **Superadmin:** Creato manualmente via SQL (limite 1-2 per club)

---

## Gestione Stagioni

**Accesso:** Admin + Superadmin only  
**Pagina:** `/admin/stagioni`

### Creare Stagione

**Form:**
```
Nome Stagione: "Autunno 2026"
Data Inizio: 01/09/2026
Data Fine: 31/12/2026
Imposta Come Corrente: [Toggle]
```

**Logica:**
- Una sola stagione "corrente" per volta
- Calendario mostra solo date stagione corrente
- Prenotazioni vincolate a stagione attiva
- Slot associati rimangono anche se stagione non corrente

### Modificare Stagione

- Nome, date inizio/fine modificabili
- Cambio "stagione corrente" aggiorna subito il calendario visibile
- Storico preservato

### Disattivare Stagione

- Soft delete: rimane nel DB per storico
- Prenotazioni storiche visibili ma non modificabili
- Disattivazione non cancella slot

---

## Slot e Calendario

**Accesso:** Admin + Superadmin + Utenti (visualizzazione)  
**Pagine:** 
- Visualizzazione: `/calendario`
- Gestione: `/admin/slot`

### Slot Ricorrenti (Settimanali)

**Creazione (`/admin/slot`):**

```
Nome: "Allenamento Lunedì"
Giorno della Settimana: Lunedì
Ora Inizio: 19:00
Ora Fine: 20:30
Capienza: 8
Data Inizio Validità: 01/09/2026
Data Fine Validità: 31/12/2026

Settore: Tennis
Serie: A3 (opzionale)
Note: Allenamento generale
```

**Vincoli Settimanali per Ruolo:**
```
Agonisti: Max 3 prenotazioni/settimana
Amatori: Max 2 prenotazioni/settimana
```

**Calendario Generato Automaticamente:**
- Istanze create al volo per ogni lunedì tra data inizio e fine
- Non persistenti in DB (generate dinamicamente)
- Disattivazione slot → future istanze non mostrate

**Modifica Slot Ricorrente:**
- Nome, capienza, note → affronta solo future istanze
- Giorno/ora modifica → non permessa (ricrea nuovo slot)

### Slot Extra / Eventi

**Creazione:**
```
Nome: "Torneo Estivo"
Data: 15/09/2026
Ora Inizio: 10:00
Ora Fine: 18:00
Capienza: 32
Note: Registrazione pre-torneo obbligatoria
```

- Singolo evento, non ricorrente
- Capienza e vincoli personali applicati come slot ricorrenti
- Non ripete

### Chiusure Centro

**Pagina:** `/admin/slot` → Tab "Chiusure Centro"

```
Data Inizio: 25/12/2026
Data Fine: 01/01/2027
Motivo: Chiusura natalizia
```

**Effetti:**
- Tutte le istanze slot ricorrenti in questo range → non prenotabili
- Utenti vedono "Centro Chiuso" nel calendario
- Prenotazioni esistenti non cancellate

### Visualizzazione Calendario

**Pagina:** `/calendario`

**Modalità Visualizzazione:**
- Vista Mensile: Grid giorni con slot disponibili
- Vista Settimanale: Timeline oraria (opzionale)

**Indicatori:**
- 🟢 Verde: Slot non pieno (click per prenotarsi)
- 🟡 Giallo: Slot quasi pieno (posti limitati)
- 🔴 Rosso: Slot pieno o centro chiuso
- 🔵 Blu: Slot per cui sei già prenotato

**Info Slot (click):**
```
Allenamento Lunedì
Ora: 19:00–20:30
Capienza: 8/8 (pieno)
[Prenotati: 7/8]
[Waiting List: 2]

Posti Disponibili: 0
Luogo: Palestra X
Indirizzo: Via Roma 123
Note: Allenamento avanzato
```

**Azioni:**
- ✅ Click slot non pieno → Conferma prenotazione
- ⏳ Click slot pieno → Iscriviti waiting list
- ❌ Scarta prenotazione

---

## Prenotazioni

**Accesso:** Tutti gli utenti + Admin (gestione)  
**Pagine:**
- Visualizzazione: `/prenotazioni`
- Gestione admin: `/admin/prenotazioni`

### Prenotarsi (Workflow)

1. **Dal Calendario:**
   - Vai a `/calendario`
   - Click su slot disponibile
   - Popup di conferma
   - Click "Prenota"
   - ✅ Notifica: "Prenotazione confermata"

2. **Validazioni Applicate:**
   - ✅ Capienza slot
   - ✅ Ruolo compatibile
   - ✅ Limite settimanale rispettato
   - ✅ Non nel passato (amatori/agonisti)
   - ✅ Centro non chiuso

3. **Errori:**
   - ❌ "Slot pieno" → vai waiting list
   - ❌ "Limite settimanale superato" → scegli altra data
   - ❌ "Centro chiuso" → non prenotabile

### Prenotazioni Personali

**Pagina:** `/prenotazioni`

**Sezione "Prossime" (Elenco):**
```
| Data | Ora | Slot | Capienza | Stato |
|------|-----|------|----------|-------|
| 09/09 | 19:00–20:30 | Allenamento Lunedì | 8/8 | ✅ Confermato |
| 10/09 | 18:00–19:00 | Torneo | 32/32 | ⏳ Waiting List |
```

**Azioni per Prenotazione Futura:**
- ❌ Cancella (libera un posto per waiting list)
- 📝 Modifica (se admin)

**Azioni per Prenotazione Passata:**
- 👁️ Visualizza (storico)
- 📊 Statistiche (partecipazione, ecc)

### Storico Prenotazioni

**Tab "Storico":**
- Elenco tutte prenotazioni passate
- Filtri: stagione, mese, slot
- Esportazione dati (CSV opzionale)

### Overbooking e Waiting List

**Scenario: Slot Pieno**
1. Utente click slot pieno
2. Messaggio: "Slot pieno. Desideri iscriverti alla waiting list?"
3. Click ✅ → Posizionato in lista (ordine FIFO)
4. Visualizzazione: "⏳ Waiting List #3 of 5"

**Auto-Promozione:**
1. Qualcuno cancella prenotazione
2. Sistema sposta utente #1 della waiting list → prenotazione confermata
3. Email notifica (quando implementate) con nuovo orario

**Gestione Waiting List:**
- Nessun limite su lunghezza
- Ordine FIFO (primo arrivato primo promosso)
- Utente può cancellarsi dalla WL
- Admin può rimuovere utenti dalla WL

### Gestione Prenotazioni (Admin)

**Pagina:** `/admin/prenotazioni`

**Tabella Completa:**
```
| Data | Utente | Slot | Stato | Azioni |
|------|--------|------|-------|--------|
| 09/09 | Mario Rossi | Allenamento | Confermato | 🗑️ Modifica Cancella |
```

**Filtri:**
- Data (da/a)
- Utente (ricerca nome/email)
- Slot
- Stato: confermato, waiting list, cancellato
- Stagione

**Azioni:**
- ✏️ **Modifica:** Cambio data/slot per utente (vincoli bypassati)
- 🗑️ **Cancella:** Rimuovi prenotazione
- 📋 **Duplica:** Copia prenotazione per altra data
- ⏳ **Waiting List:** Visualizza/gestisci lista d'attesa

---

## Profilo Utente

**Pagina:** `/profilo`  
**Accesso:** Tutti gli utenti

### Dati Base

**Visualizzazione:**
```
Nome: Mario
Cognome: Rossi
Email: mario@example.com
Telefono: +39 123 456 789 [✏️ Modifica]
Ruolo: Agonista
Data Registrazione: 01/01/2026
Squadra Campionato: Fortitudo A [✏️ Admin only]
```

**Modifica Personale:**
- Utente può modificare: nome, cognome, telefono
- Non può modificare: email, ruolo
- Click ✏️ → form inline, salva con server action

### Certificato Medico

**Stato Badge:**
- 🟢 **Valido:** Scadenza > 30 giorni
- 🟡 **In Scadenza:** Scadenza tra 0–30 giorni
- 🔴 **Scaduto:** Scadenza < oggi

**Visualizzazione:**
```
Certificato Medico
Stato: 🟢 Valido
Scadenza: 15/12/2026
Documento: [Visualizza] [Scarica]
Caricato da: Admin (15/06/2026)
```

**Modifica (Admin Only):**
- Click ✏️ → form:
  - Data scadenza (picker)
  - Note (textarea)
  - Carica documento (file)
- Salva → audit log traccia modifica

### Tessera FITET

**Visibile per:** Agonisti  
**Visualizzazione:**
```
Tessera FITET
Numero Tessera: 12345678
Federazione: FITET (ITA)
Data Registrazione: 01/01/2026
[✏️ Modifica (Admin only)]
```

**Modifica (Admin Only):**
- Numero tessera (text input)
- Data aggiornamento (auto = today)
- Salva → audit log

### Preferenze Notifiche

**In Sviluppo** (v1.1.0)

Quando implementate:
```
Ricevi Notifiche Email
[✓] Conferma Prenotazione
[✓] Reminder 24h prima
[ ] Cambio Presenze Campionato
[✓] Promozione Waiting List
```

---

## Campionati

**Accesso:**
- Visualizzazione: Tutti (pubblico)
- Gestione: Admin + Superadmin only

### Pagine Pubbliche

#### `/campionato` — Hub Campionato

**Visualizzazione:**
```
Campionato in Corso
Autunno 2026 — Serie A3

[Squadre: 6]  [Programmate: 12]  [Completate: 5]

[La tua squadra (se agonista)]
Nome: Fortitudo A
Serie: A3, Girone 1
[👉 Visualizza squadra e partite]

[Navigazione]
👥 Visualizza tutte le squadre
📊 Classifica e Risultati
📅 Calendario partite
```

#### `/campionato/[id]/squadre` — Squadre

**Tabella:**
```
| Pos | Nome Squadra | Serie | Girone | Giocatori | Azioni |
|-----|--------------|-------|--------|-----------|--------|
| 1   | Fortitudo A  | A3    | 1      | 4         | 👁️ Dettagli |
| 2   | Altro Team   | A3    | 1      | 4         | 👁️ Dettagli |
```

**Click Dettagli:**
```
Fortitudo A
Serie: A3, Girone 1
Stato: Attiva

Giocatori (4):
- Samuele Bosetti (numero tessera: xxx)
- Giulia Neodo
- Rebecca Barone
- Flavio Caloni
```

#### `/campionato/[id]/classifica` — Classifica

**Tabella Squadre:**
```
| Pos | Squadra | Serie | Girone | Partite | Vittorie | Sconfitte | Punti |
|-----|---------|-------|--------|---------|----------|-----------|-------|
| 1   | Fortitudo A | A3 | 1 | 5 | 4 | 1 | 12 |
| 2   | Altro Team | A3 | 1 | 5 | 3 | 2 | 9 |
```

**Tabella Risultati:**
```
| Data | Squadra | Risultato | Avversario | Tipo | Punti |
|------|---------|-----------|------------|------|-------|
| 05/09 | Fortitudo A | 7-4 | Altro Team | Singola | 3 |
| 03/09 | Fortitudo A | 5-6 | Team X | Singola | 0 |
```

#### `/campionato/[id]/calendario` — Calendario Partite

**Vista Timeline:**
```
📅 Settembre 2026
├─ 05/09 ore 19:00 → Fortitudo A vs Altro Team (Serie A3, Girone 1)
│  Tipo: Singola | Sede: Casa | Luogo: Palestra X
│  Risultato: 7-4 (Completata) | Punti: 3
├─ 10/09 ore 20:00 → Fortitudo A vs Team Y (Serie A3, Girone 1)
│  Tipo: Andata | Sede: Trasferta
│  Risultato: — (Programmata) | [👁️ Visualizza Dettagli]
```

### Pagine Amministrazione

#### `/admin/campionato` — Gestisci Campionati

**Tabella:**
```
| Nome | Stagione | Serie | Stato | Squadre | Azioni |
|------|----------|-------|-------|---------|--------|
| Autunno 2026 | Autunno 2026 | A3 | In Corso | 6 | 👁️ Modifica |
```

**Click Modifica:**
- Nome, stagione, serie (read-only dopo creazione)
- Disattiva campionato (soft delete)
- Accesso a: Squadre, Partite, Classifica

#### `/admin/campionato/[id]/squadre` — Gestisci Squadre

**Tabella Squadre:**
```
| Squadra | Girone | Giocatori | Stato | Azioni |
|---------|--------|-----------|-------|--------|
| Fortitudo A | 1 | 4 | Attiva | ✏️ 🔴 |
```

**Click ✏️ (Modifica Squadra):**

**Form:**
```
Nome Squadra: Fortitudo A
Girone: 1
Stato: Attiva [Disattiva Squadra] (rosso)

Giocatori Assegnati (4):
├─ Samuele Bosetti (active) [Rimuovi]
├─ Giulia Neodo (active) [Rimuovi]
├─ Rebecca Barone (active) [Rimuovi]
└─ Flavio Caloni (active) [Rimuovi]

Aggiungi Giocatore:
[Dropdown: Agonisti Non Assegnati ▼]
→ Scegliete da lista giocatori senza squadra
[+ Aggiungi]
```

**Azioni:**
- ✏️ Nome/girone modifica
- 🔴 **Disattiva Squadra:** Soft delete, non rimuove giocatori
- ➕ **Aggiungi Giocatore:** Dropdown agonisti non assegnati
- 🗑️ **Rimuovi Giocatore:** Unlink da squadra (rimane agonista)

#### `/admin/campionato/[id]/partite` — Gestisci Partite

**Creazione Partita:**

**Form:**
```
Squadra: [Dropdown] *
Avversario: [Text] * (es: "Squadra XYZ")
Società Avversaria: [Text] (opzionale)

Tipo Gara: [Singola/Andata/Ritorno] *
Sede: [Casa/Trasferta] *
Data e Ora: [DateTime] *

Luogo: [Text] (opzionale, es: "Palestra X")
Indirizzo: [Text] (opzionale)
Note: [Textarea]

[🔵 Crea Partita]
```

**Tabella Partite Esistenti:**
```
| Data | Squadra | Serie | Girone | Avversario | Tipo | Stato | Azioni |
|------|---------|-------|--------|------------|------|-------|--------|
| 05/09 | Fortitudo A | A3 | 1 | Altro Team | Singola | Completata | Gestisci |
| 10/09 | Fortitudo A | A3 | 1 | Team X | Andata | Programmata | Gestisci 🗑️ |
```

**Ordinamento:** Sortable per colonna (click intestazione)

**Click "Gestisci":**
→ Vai a `/admin/campionato/[id]/partite/[matchId]`

#### `/admin/campionato/[id]/partite/[matchId]` — Dettagli Partita

**INFO PARTITA (Read-Only):**
```
Fortitudo A vs Altro Team
Data: 05/09/2026 ore 19:00
Tipo: Singola | Sede: Casa (Palestra X)
Indirizzo: Via Roma 123
Note: Partita amichevole preparazione
```

**MODIFICA PARTITA (Separato da Risultato):**

**Form:**
```
Squadra: [Dropdown squadre attive]
Avversario: [Text]
Società Avversaria: [Text] (opzionale)

Tipo Gara: [Singola/Andata/Ritorno]
Sede: [Casa/Trasferta]
Data e Ora: [DateTime]

Luogo: [Text] (opzionale)
Indirizzo: [Text] (opzionale)
Note: [Textarea]

[🔵 Salva Modifiche]
```

**MODIFICA RISULTATO:**

**Form:**
```
Punteggio Nostro: [0-7 Dropdown]
Punteggio Avversario: [0-7 Dropdown]

Validazione: Somma must = 7 (altrimenti ❌ "Errore: punteggio invalido")

[🟢 Aggiorna Risultato]
```

**Scoring Automatico:**
```
7, 6, 5 → 3 punti
4 → 2 punti
3 → 1 punto
2, 1, 0 → 0 punti
```

**GESTIONE PRESENZE:**

**Tabella Giocatori:**
```
| Giocatore | Status |
|-----------|--------|
| Samuele Bosetti | [Presente/Assente Toggle] |
| Giulia Neodo | [Presente/Assente Toggle] |
| Rebecca Barone | [Presente/Assente Toggle] |
| Flavio Caloni | [Presente/Assente Toggle] |
```

- Default: "Presente" per squadra
- Admin/Superadmin click toggle → Presente ↔ Assente
- Salva automatico

**NAVIGAZIONE:**
- [← Torna a Partite]
- [🔵 Visualizza Classifica] (top right)

---

## Statistiche

**Accesso:**
- Personali: Tutti
- Amministrative: Admin + Superadmin

### Statistiche Personali

**Pagina:** `/statistiche`

**Card 1: Questa Stagione**
```
Prenotazioni: 12
Cancellazioni: 2
Tasso Partecipazione: 85%
Slot Preferito: Lunedì 19:00 (5 volte)
```

**Card 2: Andamento Mensile (Grafico)**
```
[Grafico lineare mese/prenotazioni]
Set: 5, Ott: 8, Nov: 7, Dic: 4
```

**Card 3: Prenotazioni per Slot**
```
| Slot | Prenotazioni | % |
|------|--------------|---|
| Lunedì 19:00 | 5 | 42% |
| Martedì 18:00 | 4 | 33% |
| Giovedì 20:00 | 3 | 25% |
```

**Filtri:**
- Stagione: [Dropdown tutte stagioni]
- [Aggiorna Dati]

### Statistiche Amministrative

**Pagina:** `/admin/statistiche`

**Card 1: Riepilogo Stagione**
```
Prenotazioni Totali: 487
Cancellazioni: 23
Tasso Partecipazione Media: 89%
Picco Orario: Lunedì 19:00
```

**Card 2: Andamento (Grafico Mesi)**
```
[Grafico stacked: prenotazioni, cancellazioni]
```

**Card 3: Riepilogo per Utente**

**Tabella:**
```
| Utente | Ruolo | Prenotazioni | Cancellazioni | % Partecipazione | Squadra |
|--------|-------|--------------|----------------|------------------|---------|
| Mario Rossi | Agonista | 12 | 1 | 92% | Fortitudo A |
| Elena Bianchi | Amatore | 8 | 3 | 73% | — |
```

**Filtri:**
- Ruolo: [All/Agonista/Amatore]
- Squadra: [All + squadre attive]
- Stagione: [Dropdown]
- Ricerca: [Text] nome/email
- [Filtra]

**Azioni Tabella:**
- Click riga → Storico prenotazioni utente
- 📊 Export CSV (opzionale)

**Card 4: Certificati Medici**

**Report:**
```
Validi: 45 (90%)
In Scadenza (0–30 giorni): 3 (6%)
Scaduti: 2 (4%)

Scaduti:
├─ Mario Verdi (scaduto 15/08/2026) [⚠️]
└─ Anna Neri (scaduto 30/08/2026) [⚠️]

In Scadenza:
├─ Luca Russo (scade 10/09/2026)
├─ Francesca Marini (scade 12/09/2026)
└─ Paolo Gallo (scade 20/09/2026)
```

---

## Amministrazione Utenti

**Pagina:** `/admin/utenti`  
**Accesso:** Admin + Superadmin

### Ricerca e Filtri

**Ricerca:**
```
Ricerca per Nome/Email: [mario]
Ruolo: [All/Agonista/Amatore/Admin]
Stato: [Attivo/Disattivato]
[🔍 Cerca]
```

### Tabella Utenti

```
| Nome | Email | Ruolo | Stato | Certificato | Tessera | Squadra | Azioni |
|------|-------|-------|-------|-------------|---------|---------|--------|
| Mario Rossi | mario@ex.com | Agonista | Attivo | 🟢 Valido | 12345 | Fortitudo A | ✏️ 🔐 🗑️ |
| Elena Bianchi | elena@ex.com | Amatore | Disattivo | 🟡 Scadenza | — | — | ✏️ 🔓 🗑️ |
```

**Icone Azioni:**
- ✏️ Modifica profilo
- 🔐 Disattiva accesso
- 🔓 Riattiva accesso
- 🗑️ Elimina utente

### Modifica Profilo

**Form (✏️):**
```
Nome: [Text] ✏️
Cognome: [Text] ✏️
Email: [Text] (read-only)
Telefono: [Text] ✏️

Ruolo: [Agonista/Amatore/Admin] ✏️
Squadra: [Dropdown squadre attive] ✏️

Certificato Medico:
  Data Scadenza: [Picker] ✏️
  Note: [Textarea] ✏️
  [⬆️ Carica Documento]

Tessera FITET (Agonisti):
  Numero: [Text] ✏️
  Data Aggiornamento: [Auto = today]

[🔵 Salva Modifiche] [Annulla]
```

**Audit Log:**
- Traccia ogni modifica
- Chi, quando, cosa cambiato

### Disattivazione/Riattivazione

**Click 🔐 (Disattiva):**
```
⚠️ Disattiva Accesso

Questo disattiverà il login per: mario@ex.com

I dati rimangono:
✅ Storico prenotazioni
✅ Statistiche
✅ Account (recoverable)

[Continua] [Annulla]
```

**Risultato:**
- ✅ Campo `active = false` in DB
- 🔴 Utente non può loginare
- 🟢 Dati storici preservati
- 👁️ Tabella mostra "Disattivato"

**Click 🔓 (Riattiva):**
- ✅ Campo `active = true`
- 🟢 Utente può loginare
- 🟢 Dati storici intatti

### Eliminazione Utente

**Click 🗑️ (Elimina):**

```
⚠️ ELIMINAZIONE DEFINITIVA

Questa azione è IRREVERSIBILE.

Verranno eliminati:
❌ Account e profilo
❌ Tutte le prenotazioni
❌ Storico e statistiche
✅ Audit log rimane (per compliance)

Per continuare:
☐ Confermo eliminazione di mario@ex.com [Obbligatorio]

[🔴 Elimina Definitivamente] [Annulla]
```

**Requisiti:**
- Checkbox deve essere checked
- Conferma 2x (sicurezza)

**Risultato:**
- Hard delete: account, profilo, prenotazioni rimossi
- Audit log: registra DELETE action
- Email: opzionale notifica utente

---

## Audit Log e Storico

**Accesso:** Superadmin only  
**Logica:** Tracciamento automatico di tutte le azioni

### Azioni Tracciate

| Azione | Tabella | Chi | Quando | Cosa |
|--------|---------|-----|--------|------|
| CREATE prenotazione | bookings | Mario | 01/09 19:30 | Slot = Lunedì 19:00 |
| UPDATE certificato | profiles | Admin | 02/09 10:00 | Scadenza: 15/12/2026 |
| DELETE prenotazione | bookings | Admin | 03/09 15:00 | Motivo: User requested |

---

## Sicurezza e RLS

### Row Level Security (RLS)

Tutte le query client-side rispettano RLS policies:

- **profiles:** Utente vede solo proprio profilo + admin info pubbliche
- **bookings:** Utente vede solo proprie prenotazioni
- **championship_teams:** Pubblico read, modifica admin-only
- **championship_matches:** Pubblico read, modifica admin-only

### Admin Client

Alcune operazioni admin usano **service role key** per bypass RLS:
- Creazione/modifica prenotazioni passate
- Modifica certificati/tessera utenti
- Gestione campionati

---

## Versione Info

- **Versione:** 1.0.0
- **Release Date:** 2026-09-06
- **Status:** Stabile – Production Ready
- **Prossima:** 1.1.0 (Email Notifications)

Vedi [ROADMAP.md](ROADMAP.md) per features in sviluppo.
