# Report Amministrativi Avanzati

## 📊 Andamento Prenotazioni

Sezione nella pagina `/statistiche` che visualizza l'andamento di **tutte le prenotazioni** con filtri per periodo.

### Filtri disponibili

- **Questo mese** — Periodo dal 1° al 30/31 del mese corrente
- **Mese scorso** — Mese precedente completo
- **Prossimo mese** — Mese successivo completo
- **Custom** — Range personalizzato con date picker

### Visualizzazione

**Grafico a colonne stacked:**
- 🔵 **Blu** (fondo) — Prenotazioni attive
- 🔴 **Rosso** (sopra) — Prenotazioni cancellate

**Dati mostrati:**
- Numero di prenotazioni per giorno
- Totale attive nel periodo
- Totale cancellate nel periodo
- Periodo selezionato

### Esempio di utilizzo

1. Clicca su "Questo mese" per vedere l'andamento corrente
2. Clicca su "Custom" per analizzare un range specifico
3. Il grafico si aggiorna istantaneamente
4. I totali sotto mostrano le statistiche aggregate

---

## 👥 Riepilogo Utenti

Tabella interattiva con visibilità completa di tutti gli utenti e loro statistiche.

### Filtri

**Per Ruolo:**
- Tutti (N) — Mostra tutti gli utenti
- Admin (N) — Solo amministratori
- Agonisti (N) — Solo agonisti
- Amatori (N) — Solo amatori

I numeri tra parentesi mostrano il conteggio per categoria.

**Ricerca:**
- Casella di testo per cercare per:
  - Nome e cognome (es. "Mario")
  - Parte del nome (es. "Mari")
  - ID utente (es. "550e...")

### Ordinamento

Clicca su qualsiasi intestazione colonna per ordinare:

| Colonna | Ordinamento |
|---------|-------------|
| Utente | Alfabetico A-Z |
| Ruolo | admin → agonista → amatore |
| Limite/sett. | Numerico 1-3 |
| Settimana | Conteggio decrescente |
| Mese | Conteggio decrescente |
| Anno | Conteggio decrescente |
| Cancellate | Conteggio decrescente |

**Indicatori visivi:**
- ↑ = Ordinamento ascendente
- ↓ = Ordinamento discendente

### Visualizzazione

**Colori per ruolo:**
- 🟠 Arancione: Admin
- 🔵 Blu: Agonisti
- 🟦 Navy: Amatori

**Contesto:**
- Mostra "Visualizzati X di Y utenti" in base a filtri attivi
- Le colonne statistiche (Settimana, Mese, Anno, Cancellate) sono numeri
- Cancellate sono visualizzate in rosso per evidenziarle

### Workflow tipico

```
1. Filtra per ruolo (es. "Agonisti")
2. Cerca un nome specifico se needed
3. Clicca su "Settimana" per ordinare per attività recente
4. Identifica gli utenti più/meno attivi
```

---

## 🔧 Componenti Tecnici

### `AdminBookingsChart`

File: `src/components/admin-bookings-chart.tsx`

**Props:**
- `bookings` — Array completo di prenotazioni

**State interno:**
- `periodFilter` — Filtro periodo attuale
- `customRange` — Range personalizzato (se custom selezionato)

**Funzionalità:**
- Aggregazione giornaliera
- Calcolo stack (attive + cancellate)
- Normalizzazione grafico

### `AdminUsersReport`

File: `src/components/admin-users-report.tsx`

**Props:**
- `users` — Array di `{ profile, stats }`

**State interno:**
- `sortField` — Colonna ordinamento attuale
- `sortOrder` — Ascendente/Discendente
- `roleFilter` — Filtro ruolo
- `searchTerm` — Termine ricerca

**Funzionalità:**
- Filtro multi-criterio
- Ordinamento multi-colonna
- Ricerca full-text (lato client)

---

## 📱 Responsività

Entrambi i componenti sono:
- **Mobile-friendly**: Scroll orizzontale su schermi piccoli
- **Adaptive**: Layout cambia su breakpoint Tailwind
- **Fast**: Tutto calcolato lato client (nessuna API call)

---

## ✅ Checklist di test

- [ ] Andamento prenotazioni:
  - [ ] Filtra "Questo mese" → mostra dati corretti
  - [ ] Filtra "Mese scorso" → mostra mese precedente
  - [ ] Filtra "Custom" → date picker appare
  - [ ] Custom range → grafico si aggiorna
  - [ ] Numeri totali sono coerenti

- [ ] Riepilogo utenti:
  - [ ] Filtro "Tutti" mostra tutti gli utenti
  - [ ] Filtro "Agonisti" mostra solo agonisti (con count)
  - [ ] Ricerca "Mario" filtra nome
  - [ ] Click "Utente" ordina A-Z
  - [ ] Click "Settimana" ordina per numero decrescente
  - [ ] Click due volte su colonna inverte ordinamento (↑↓)
  - [ ] Combina filtro ruolo + ricerca = filtra entrambi
  - [ ] Contatore in fondo aggiornato
