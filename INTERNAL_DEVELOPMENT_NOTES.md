# Internal Development Notes

Documento interno per tracciare features in sviluppo, sperimentali o non pubbliche.

**⚠️ Non includere in documentazione pubblica (README, FEATURES, ROADMAP)**

---

## Features in Sviluppo Interno

### 🔵 Google OAuth Integration (PAUSED)

**Status:** Paused — Not in public documentation  
**Target Version:** Future (not scheduled)  
**Visibility:** Internal only

#### Descrizione

Integrazione Google OAuth per login opzionale con account Google, bypassando email + password registration.

#### Implementazione Tecnica

**Provider:** Supabase OAuth Providers (built-in support)

**Setup:**
1. Google Cloud Console → Create OAuth 2.0 credentials
2. Supabase Dashboard → Authentication → Providers → Google
3. Configurazione client ID e client secret
4. Redirect URI: `https://[PROJECT].supabase.co/auth/v1/callback`

**Frontend:**
- Supabase `signInWithOAuth()` method
- Google button nel login form
- Auto-redirect dopo login

**Database:**
- Profiles linked via `auth.users.id` (Supabase auto-sync)
- No extra tables needed

#### Motivo Pausa

- Complessità setup per club privato
- Focus prioritario su features core (booking, campionati)
- Documentazione/support overhead
- Users preferisce email/password per privacy

#### Se Riprendere

1. Crea Google Cloud project
2. Configura OAuth consent screen
3. Supabase: Enable Google provider
4. Test login flow
5. Update: README, FEATURES, ROADMAP (se parte di release)
6. Deploy e monitor

#### Codice di Riferimento

```typescript
// Client-side: Login con Google
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

---

## Features Rimosse da Documentazione Pubblica

### Google OAuth (v1.0.0)

**Rimosso da:**
- README.md: Autenticazione sezione + Setup Authentication
- FEATURES.md: Registrazione + Login opzioni

**Data Rimozione:** 2026-09-06  
**Commit:** (Vedi git log per rimozione Google OAuth)

**Motivo:** Not prioritized for v1.0.0 — focus su email auth  
**Preservato in:** DEVELOPMENT_STATUS_NOTIFICHE.md (Google OAuth per email sending)

---

## Internal Links

- [DEVELOPMENT_STATUS_NOTIFICHE.md](DEVELOPMENT_STATUS_NOTIFICHE.md) — Email notifications setup (includes Google OAuth for SMTP)
- [ROADMAP.md](ROADMAP.md) — Public roadmap (v1.0.0 stable + v1.1.0 in progress)
- [FEATURES.md](FEATURES.md) — Public features documentation

---

**Last Updated:** 2026-09-06  
**Visibility:** Internal only — Do not share with end users
