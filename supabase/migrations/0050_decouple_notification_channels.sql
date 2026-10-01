-- ============================================================
-- Decoupling notifiche: svincola i canali (email/telegram) dalla tipologia
-- ============================================================

-- Step 1: Aggiungi colonna email_enabled
ALTER TABLE public.notification_configs
ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT true;

-- Step 2: Rinomina enable_telegram a telegram_enabled
ALTER TABLE public.notification_configs
RENAME COLUMN enable_telegram TO telegram_enabled;

-- Aggiorna commenti per documentazione
COMMENT ON COLUMN public.notification_configs.is_active IS 'Attiva/disattiva completamente questa tipologia di notifica';
COMMENT ON COLUMN public.notification_configs.email_enabled IS 'Se true, invia notifiche via email quando la notifica è attiva';
COMMENT ON COLUMN public.notification_configs.telegram_enabled IS 'Se true, invia notifiche via Telegram quando la notifica è attiva';
