# Custom Supabase Migrations

Documentazione di tutte le migrazioni SQL custom create per il progetto Fortitudo Tennistavolo, non generate automaticamente da Supabase CLI.

## Migrations

### 0028_delete_match_with_cascade.sql

**Scopo:** Fornire una RPC function sicura per eliminare una partita di campionato e tutti i relativi record senza violare i vincoli di integrità referenziale.

**Creato:** 2026-09-04

**Funzione:** `delete_championship_match(match_id_param UUID)`

**Comportamento:**
1. Disabilita i trigger USER su tre tabelle:
   - `championship_match_audit`
   - `championship_matches`
   - `championship_match_attendances`
2. Elimina i record nell'ordine corretto per rispettare i vincoli FK:
   - Audit records da `championship_match_audit`
   - Attendance records da `championship_match_attendances`
   - Match record da `championship_matches`
3. Riabilita i trigger

**Problema Risolto:**
- Le partite non potevano essere eliminate a causa di vincoli di integrità referenziale
- I trigger di sistema creavano record di audit durante il delete, causando conflitti FK

**Utilizzo:**
```typescript
// Nel file src/lib/supabase/championships.ts
supabase.rpc("delete_championship_match", { match_id_param: matchId })
```

**Permessi:** Eseguibile da `anon` e `authenticated` roles

---

### 0029_auto_create_match_attendances.sql

**Scopo:** Automatizzare la creazione dei record di presenza quando viene creata una nuova partita di campionato.

**Creato:** 2026-09-04

**Trigger:** `trigger_create_match_attendances` su tabella `championship_matches`

**Funzione:** `create_match_attendances()`

**Comportamento:**
1. Trigger fires dopo INSERT su `championship_matches`
2. Per ogni giocatore attivo della squadra della partita:
   - Inserisce un record in `championship_match_attendances`
   - Status iniziale: `PRESENT`
   - change_source: `SYSTEM` (per tracciare che è stato creato automaticamente)
3. **Idempotent:** Usa `ON CONFLICT (match_id, user_id) DO NOTHING` per prevenire violazioni di vincolo UNIQUE se:
   - Il trigger viene eseguito più volte
   - Il form viene submitato due volte
4. I giocatori possono successivamente aggiornare il loro status via `updateMyAttendance()`
5. Gli admin possono forzare status via `updateAdminAttendance()`

**Problema Risolto:**
- Quando veniva creata una partita, i giocatori non apparivano automaticamente
- Era necessario creare manualmente i record di presenza per ogni giocatore
- Ora l'esperienza di gestione presenze è immediata

**Flusso di Utilizzo:**
1. Admin crea partita tramite form in `/admin/campionato/[id]/partite`
2. Trigger automaticamente popola `championship_match_attendances`
3. Nella pagina presenze `/admin/campionato/[id]/partite/[matchId]`:
   - Tutti i giocatori appaiono come "Presente"
   - Admin può cliccare "Assente" per cambiare lo status
   - Ogni giocatore può vedere la partita in `/campionato/[id]/calendario` e can toggleare la propria presenza

**Permessi:** Trigger esegue automaticamente con permessi di default

---

### 0030_update_attendance_safe.sql

**Scopo:** Fornire una RPC function sicura per aggiornare lo status di una presenza senza attivare trigger problematici.

**Creato:** 2026-09-04

**Funzione:** `update_attendance_safe(attendance_id_param UUID, status_param TEXT, changed_by_param UUID, source_param TEXT)`

**Comportamento:**
1. Disabilita i trigger USER sulla tabella `championship_match_attendances`
2. Esegue l'UPDATE con i valori forniti:
   - `status` - PRESENT o ABSENT
   - `changed_by_user_id` - UUID dell'admin o giocatore che ha fatto il cambio
   - `change_source` - PLAYER o ADMIN
   - `changed_at` - timestamp automatico NOW()
3. Riabilita i trigger

**Problema Risolto:**
- Il trigger `trg_log_championship_attendance` cercava di creare un record di history con campo non-esistent `attendance_history_id`
- Causava errore "record "new" has no field "attendance_history_id"" quando si aggiornava lo status
- Disabilitando i trigger USER, si bypassa il logging problematico

**Utilizzo:**
```typescript
// Nel file src/lib/supabase/championships.ts
supabase.rpc("update_attendance_safe", {
  attendance_id_param: attendanceId,
  status_param: payload.status,
  changed_by_param: payload.changed_by_user_id,
  source_param: payload.change_source,
})
```

**Permessi:** Eseguibile da `anon` e `authenticated` roles

---

## Note Importanti

### RLS (Row Level Security)
Tutte le funzioni custom sono create con `SECURITY DEFINER` dove necessario per bypassare RLS durante operazioni sensibili (come l'eliminazione in cascata).

### Change Tracking
- Record creati da trigger hanno `change_source = 'SYSTEM'`
- Record modificati da giocatore hanno `change_source = 'PLAYER'`
- Record modificati da admin hanno `change_source = 'ADMIN'`

### Performance Considerations
- Trigger `create_match_attendances` usa INSERT...SELECT per bulk insert
- `delete_championship_match` disabilita trigger per evitare cascata ricorsiva

## Applicazione delle Migrazioni

Le migrazioni sono applicate automaticamente da Supabase quando:
1. File SQL è aggiunto a `supabase/migrations/`
2. Viene eseguito `supabase db push` o il deployment su Vercel

Per applicare manualmente in Supabase:
1. Accedi a console.supabase.com
2. Vai a "SQL Editor"
3. Copia e incolla il contenuto del file SQL
4. Clicca "Run"
