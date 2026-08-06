# Gestione Certificati Medici

## 📋 Implementazione completata

Questa feature aggiunge la gestione della scadenza dei certificati medici con avvisi automatici e report statistici.

## 🚀 Installazione

### 1. Applica la migrazione SQL

Nel SQL Editor di Supabase, esegui la migrazione:

```sql
-- Aggiungi campo per la scadenza del certificato medico
alter table public.profiles
add column medical_certificate_expiry date;

-- Aggiungi impostazione admin per i giorni di avviso (default 30)
insert into public.app_settings (key, value)
values ('medical_cert_warning_days', '30')
on conflict (key) do update set value = excluded.value;

-- Funzione helper per calcolare lo stato del certificato
create or replace function public.medical_cert_status(cert_expiry date)
returns text
language sql immutable as $$
  select case
    when cert_expiry is null then 'missing'
    when cert_expiry < current_date then 'expired'
    when cert_expiry <= current_date + interval '30 days' then 'expiring'
    else 'valid'
  end;
$$;
```

### 2. Riavvia il dev server

```bash
npm run dev
```

## 📱 Funzionalità

### Profilo Utente (`/profilo`)

**Sezione "Certificato medico":**
- Visualizza lo stato del certificato con badge colorato:
  - 🟢 Verde: Certificato valido
  - 🟠 Arancione: In scadenza (entro 30 giorni)
  - 🔴 Rosso: Scaduto
  - ⚪ Grigio: Non inserito
- Input per inserire/aggiornare la data di scadenza
- Mostra i giorni rimanenti quando in scadenza

### Gestione Admin Utenti (`/admin/utenti`)

**Per ogni utente:**
- Badge dello stato certificato (visibile subito)
- Data di scadenza (se presente)
- Codice colore immediato per identificare i problemi

### Report Statistiche (`/statistiche`)

**Sezione "Certificati medici" (solo admin):**

**Filtri (con contatori):**
- Tutti
- Non inserito
- Scaduti
- In scadenza
- Validi

**Colonne ordinabili:**
- Nome utente (A-Z)
- Stato del certificato
- Data di scadenza

**Funzionalità:**
- Clicca sull'intestazione per ordinare (↑ ascendente, ↓ discendente)
- Seleziona un filtro per visualizzare solo quella categoria
- I contatori si aggiornano in tempo reale

## 🔧 Configurazione

### Parametro di avviso (giorni)

Il parametro è configurato a **30 giorni** nella migrazione. Per modificarlo:

```sql
-- Aggiorna il numero di giorni per l'avviso
update public.app_settings 
set value = '20'
where key = 'medical_cert_warning_days';
```

Valori consigliati:
- `20` — avviso con largo anticipo
- `30` — standard (default)
- `7` — avviso last-minute

### Accesso alle impostazioni (opzionale)

Se si vuole un'interfaccia admin per gestire questo setting:

```sql
-- Leggi il valore corrente
select value from public.app_settings 
where key = 'medical_cert_warning_days';
```

## 📊 Struttura dati

### Tabella `profiles`

```sql
medical_certificate_expiry date  -- data di scadenza
```

### Tabella `app_settings`

```sql
key = 'medical_cert_warning_days'
value = '30'
```

### Funzione helper

```sql
medical_cert_status(cert_expiry date) -> text
-- Ritorna: 'missing' | 'expired' | 'expiring' | 'valid'
```

## 🎨 Stati e colori

| Stato | Label | Colore |
|-------|-------|--------|
| `missing` | Non inserito | Grigio (slate) |
| `expired` | Scaduto | Rosso (red) |
| `expiring` | In scadenza - Ngg | Arancione (amber) |
| `valid` | Valido | Verde (green) |

## 🔐 Sicurezza

- **RLS**: Le modifiche al campo usano le stesse policy di `profiles`
- **Validazione**: Il campo acepta solo date valide
- **Admin-only**: Il report statistiche è visibile solo agli amministratori

## 📝 Note

- L'utente può modificare il proprio certificato dal profilo
- L'admin vede tutti i certificati nel report e nella lista utenti
- Il warning di 30 giorni è configurabile tramite il setting `medical_cert_warning_days`
- Il report è interattivo: filtri e ordinamento lato client (no server load)

## ✅ Testing checklist

- [ ] Applica la migrazione SQL
- [ ] Login come utente ordinario
- [ ] Vai a `/profilo` e inserisci una data di certificato
- [ ] Verifica che il badge mostri lo stato corretto
- [ ] Login come admin
- [ ] Vai a `/admin/utenti` e verifica il badge certificato per ogni utente
- [ ] Vai a `/statistiche` e visualizza il report certificati
- [ ] Prova i filtri (Tutti, Scaduti, In scadenza, etc.)
- [ ] Prova l'ordinamento per Nome, Stato, Data
- [ ] Inserisci una data di certificato tra oggi e 30 giorni e verifica che diventi "In scadenza"
- [ ] Inserisci una data scaduta e verifica che diventi "Scaduto"
