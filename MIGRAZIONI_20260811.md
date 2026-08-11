# Migrazioni Supabase - 11 Agosto 2026

Eseguire le seguenti migrazioni nel **SQL Editor di Supabase** per il progetto `kzlnxnfwwfgqmqcvdyox`:

## 1. Squadra agonisti (0015_squadra_agonisti.sql)

```sql
alter table public.profiles add column squadra text;
```

Aggiunge il campo `squadra` alla tabella `profiles` per memorizzare la squadra degli agonisti.

## 2. Campi slot evento (0016_slot_evento_fields.sql)

```sql
alter table public.training_slots add column sede_evento text;
alter table public.training_slots add column url text;
```

Aggiunge i campi `sede_evento` e `url` alla tabella `training_slots` per gli slot evento.

---

**Dopo aver eseguito le migrazioni:**
- Il calendario filtrerà automaticamente gli slot in base al profilo dell'utente
- Amatori vedranno: slot Misto + Amatori
- Agonisti vedranno: slot Misto + Amatori + Agonisti
- Admin vede tutto
- Comparirà una spunta verde (✓) quando il minimo partecipanti è raggiunto
- Nel form degli slot evento si possono ora impostare sede e URL
- Nel profilo degli agonisti comparirà il campo Squadra (gestito dall'admin)
