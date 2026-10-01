-- ============================================================
-- Aggiungi colonna email a profiles da auth.users
-- ============================================================

-- Aggiungi colonna email
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Popola email da auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Aggiungi constraint per garantire email valida
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_not_null CHECK (email IS NOT NULL);

-- Indice per email per query veloci
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Commento
COMMENT ON COLUMN public.profiles.email IS 'Email dell''utente, sincronizzata da auth.users';
