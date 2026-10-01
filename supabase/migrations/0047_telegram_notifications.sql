-- ============================================================
-- Aggiungi supporto notifiche Telegram a notification_configs
-- ============================================================

-- Aggiungi colonna enable_telegram a notification_configs
ALTER TABLE public.notification_configs
ADD COLUMN enable_telegram boolean NOT NULL DEFAULT false;

-- Indice per query veloci
CREATE INDEX idx_notification_configs_telegram
ON public.notification_configs(enable_telegram)
WHERE enable_telegram = true;

-- Estendi notification_delivery per supportare più canali
-- Se non esiste già dalle migrazioni precedenti
ALTER TABLE public.notification_delivery
ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'EMAIL',
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS provider_message_id text;

-- Indice per tracking provider
CREATE INDEX IF NOT EXISTS idx_notification_delivery_provider
ON public.notification_delivery(provider, status);

-- Commento per documentazione
COMMENT ON COLUMN public.notification_configs.enable_telegram IS 'Se true, invia notifiche anche su canale Telegram';
COMMENT ON COLUMN public.notification_delivery.channel IS 'Canale di invio: EMAIL, TELEGRAM';
COMMENT ON COLUMN public.notification_delivery.provider IS 'Provider usato: GMAIL, TELEGRAM';
COMMENT ON COLUMN public.notification_delivery.provider_message_id IS 'ID messaggio dal provider (es: Telegram message_id)';
