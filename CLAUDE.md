# Fortitudo Tennistavolo — Setup e Configurazione

## Quick Start

### 1. Configurare le Credenziali Supabase

Copia il file `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

**Credenziali da usare:** Consulta la memoria persistente del progetto
- 👉 File: `C:\Users\f.caloni01\.claude\projects\C--Claude\memory\supabase-credentials.md`

**Valori da copiare in `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://kzlnxnfwwfgqmqcvdyox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chiave anonima da Supabase>
SUPABASE_SERVICE_ROLE_KEY=<chiave segreta da Supabase>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ **ATTENZIONE:** `.env.local` è nel `.gitignore` — mai pushare!

**Per le credenziali reali:** Consulta la memoria persistente del progetto (non nel git per motivi di sicurezza)

### 2. Installare Dipendenze

```bash
npm install
```

### 3. Avviare Dev Server

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

### 4. Eseguire Migrazioni SQL

Le migrazioni SQL devono essere eseguite nel [SQL Editor di Supabase](https://app.supabase.com/project/kzlnxnfwwfgqmqcvdyox/sql):

1. Apri il file migration (es: `supabase/migrations/0031_get_team_players_with_profiles.sql`)
2. Copia tutto il contenuto
3. Vai a Supabase Dashboard → SQL Editor
4. Incolla e clicca "Run"

**Migrazioni necessarie:** 0001 → 0031 (in ordine numerico)

---

## Struttura Progetto

```
tennistavolo-booking/
├── src/
│   ├── app/                    # Next.js app router pages
│   ├── components/             # React components
│   ├── lib/
│   │   ├── actions/            # Server actions (form submissions)
│   │   ├── supabase/           # Supabase client + queries
│   │   └── utils/              # Utility functions
│   └── styles/                 # Tailwind CSS
├── supabase/
│   ├── migrations/             # SQL migrations (0001–0031+)
│   └── config.toml             # CLI configuration
├── public/                     # Static assets
├── .env.example                # Template delle variabili di ambiente
├── .env.local                  # ⚠️ Credenziali locali (gitignored)
└── next.config.mjs             # Next.js configuration
```

---

## Credenziali e Sicurezza

### Memorizzazione Stabile

Le credenziali sono memorizzate in due file persistenti:

1. **File `.env.local`** (locale, gitignored)
   - Usato dal dev server e dai build
   - Contiene valori reali
   - Mai committare o pushare

2. **Memoria del progetto** (persistente tra sessioni)
   - Consulta: `C:\Users\f.caloni01\.claude\projects\C--Claude\memory\supabase-credentials.md`
   - Rimane anche se viene resettata la chat
   - Usata per consultazione rapida

### Chiavi Pubbliche vs Segrete

| Chiave | Tipo | Uso | Sicurezza |
|--------|------|-----|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pubblica | Browser + Server | Visibile nel codice |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pubblica | Browser (query con RLS) | RLS protegge i dati |
| `SUPABASE_SERVICE_ROLE_KEY` | Segreta | Solo Server | HTTPS + gitignored |

### Rotazione Chiavi (se compromesse)

1. Vai a Supabase Dashboard → Settings → API
2. Rigenera le chiavi
3. Aggiorna `.env.local` con i nuovi valori
4. Aggiorna memoria: `[[supabase-credentials]]`
5. Redeploy su Vercel

---

## Ambiente di Produzione

**URL:** https://fortitudo-tennistavolo.vercel.app

**Variabili di ambiente in Vercel:**
- Configurate nel dashboard di Vercel (non in git)
- Auto-sincronizzate dal `.env.local` al deploy

**Deploy:** Automatico su push a `main`

---

## Troubleshooting

### "Credenziali non trovate"
→ Controlla che `.env.local` esista e contenga i valori corretti
→ Consulta `[[supabase-credentials]]`

### "RLS policy denied"
→ Usa RPC functions con `SECURITY DEFINER` per operazioni admin
→ Client-side usa solo chiave anonima

### "Migrazioni falliscono"
→ Verifica ordine numerico (0001, 0002, ..., 0031)
→ Controlla che la prima migration non sia stata già eseguita

### "Dev server non si connette a Supabase"
→ Verifica `.env.local` ha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
→ Riavvia il dev server dopo modifiche a `.env.local`

---

## Note Importanti

- **Memoria:** Le credenziali sensibili sono memorizzate stabilmente nella memoria del progetto
- **Sicurezza:** La service role key è segreta e non va mai pushata
- **RLS:** Tutte le query client-side passano attraverso Row Level Security
- **Vercel:** Le variabili di ambiente sono configurate nel dashboard, non in git

