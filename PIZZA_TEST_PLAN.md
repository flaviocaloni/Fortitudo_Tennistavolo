# 🍕 Test Plan - Slot Pizza Feature

## Pre-requisiti
- [ ] Migration 0053 eseguita su Supabase ✅
- [ ] Migration 0054 eseguita su Supabase (attendere fine deployment)
- [ ] Deploy completato su Vercel
- [ ] Accesso admin attivo

---

## Test 1: Admin - Creare Slot Pizza

**Percorso:** Admin → Slot → Nuovo slot

### Steps:
1. Clicca bottone **"🍕 Pizza"** (tipo di slot)
2. Compila form:
   - Titolo: "Pizza del Team"
   - Data Pizza: (scegli una data futura)
   - Max Partecipanti: 3
   - Ora inizio: 20:00
   - Ora fine: 22:00
   - Destinatari: Misto
   - Posti minimi: 2
   - Posti massimi: 6
3. Clicca **"Crea slot"**

### Risultato atteso:
- ✅ Slot creato e visibile in Admin → Slot → 🍕 Pizza
- ✅ Mostra: data pizza, max partecipanti, posti, stato

---

## Test 2: Admin Dashboard - Statistiche Pizza

**Percorso:** Admin (home)

### Verificare:
- [ ] Card "🍕 Statistiche Pizza" visibile
- [ ] Mostra: Slot Pizza totali (1), Prenotazioni (0), Medio Partecipanti (0), In Calendario (1)

---

## Test 3: User - Prenotare Slot Pizza

**Percorso:** Calendario

### Steps:
1. Naviga al mese della Pizza
2. Trova lo slot Pizza creato
3. Clicca **"Partecipa"** (bottone di prenotazione)
4. **IMPORTANTE:** Dovrebbe comparire un **selector "Numero partecipanti"** con opzioni 1, 2, 3 (max consentito)
5. Seleziona **"2 persone"**
6. Clicca **"Partecipa"** per confermare

### Risultato atteso:
- ✅ Prenotazione creata
- ✅ Nel database: `bookings.selected_participants = 2`
- ✅ Admin Dashboard: Prenotazioni = 1, Medio Partecipanti = 2.0

---

## Test 4: Validazione - Superare Max Partecipanti

**Scenario:** Prova a selezionare più partecipanti del massimo

### Steps:
1. Crea nuovo slot pizza con `Max Partecipanti: 2`
2. Prova a prenotare con "3 persone"
3. Selector dovrebbe mostrare **"3 persone (non disponibile)"** disabilitato

### Risultato atteso:
- ✅ Opzione disabilitata (non clickable)
- ✅ Impossibile violare il limite

---

## Test 5: Admin Panel Pizza - Gestione

**Percorso:** Admin → Slot → 🍕 Pizza

### Verificare:
- [ ] Slot pizza visibile in lista
- [ ] Mostra data pizza e max partecipanti
- [ ] Bottoni: Disattiva, Riattiva, Modifica, Elimina funzionanti
- [ ] Click "Modifica" apre form di edit con campi pizza

---

## Test 6: Validazione RLS - Selezione Partecipanti

**Scenario:** Verifica che RLS accetti il campo `selected_participants`

### Steps:
1. Supabase Studio → Table "bookings"
2. Verifica record di prenotazione pizza
3. Controlla colonna `selected_participants` ha valore (es: 2)

### Risultato atteso:
- ✅ Colonna valorizzata correttamente
- ✅ Nessun errore RLS

---

## Test 7: Admin Dashboard - Aggiornamento Statistiche

**Scenario:** Le statistiche si aggiornano quando vengono fatte prenotazioni

### Steps:
1. Accedi Admin Dashboard
2. Controlla statistiche pizza (es: 1 prenotazione, media 2 partecipanti)
3. Crea una **seconda prenotazione** con 3 partecipanti
4. **Refresh pagina admin**
5. Controlla statistiche: Prenotazioni = 2, Medio Partecipanti = 2.5

### Risultato atteso:
- ✅ Statistiche si aggiornano
- ✅ Media partecipanti calcolata correttamente: (2+3)/2 = 2.5

---

## Test 8: Edge Cases

### Test 8a: Cancellare prenotazione pizza
- Prenota pizza con 2 partecipanti
- Clicca "Cancella prenotazione"
- Verifica che scompaia da calendario e da statistiche

### Test 8b: Un solo turno al giorno
- Crea due pizza nella **stessa data**
- Prenota prima pizza
- Prova a prenotare la seconda pizza nello stesso giorno
- Dovrebbe mostrare errore: "Hai già una prenotazione per questo giorno"

### Test 8c: Pizza passata (non prenotabile)
- Crea slot pizza con data nel **passato**
- Calendario non dovrebbe mostrarlo (out of range visibilità)

---

## Checklist Finale ✅

- [ ] Migration 0054 eseguita
- [ ] Admin può creare slot pizza
- [ ] Selector partecipanti appare durante prenotazione
- [ ] Massimo partecipanti validato (opzioni disabilitate)
- [ ] Admin Dashboard mostra statistiche pizza
- [ ] RLS accetta selected_participants
- [ ] Prenotazioni pizza tracciamo num. partecipanti
- [ ] Cancellazione prenotazione funziona
- [ ] Limite "un turno al giorno" vale anche per pizza
- [ ] Statistiche si aggiornano

---

## Note

- **Timeout prenotazione:** Se la prenotazione "pende", attendere 5 secondi prima di riprovare
- **Cache:** Se le statistiche non si aggiornano, prova hard-refresh (Ctrl+Shift+R)
- **Supabase:** Verifica che migration 0054 sia stata eseguita nel SQL Editor

---

## Rollback (se necessario)

Se ci sono problemi, non è necessario un rollback tecnico:
- Le migrazioni sono cumulative
- Se la validazione fallisce, la prenotazione viene rigettata
- Puoi disattivare gli slot pizza dallo admin senza cancellare nulla
