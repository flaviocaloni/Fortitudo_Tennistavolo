-- ============================================================
-- Inserisci configurazione per notifiche slot ricorrenti
-- (Esegui DOPO la migration 0048)
-- ============================================================

INSERT INTO public.notification_configs (
  notification_code, is_active, recipient_mode, enable_telegram
) VALUES (
  'RECURRING_SLOT_BOOKING', false, 'ALL_ADMINS', false
) ON CONFLICT (notification_code) DO NOTHING;

-- Commento per documentazione
COMMENT ON TYPE public.notification_code IS 'Codici notifiche: RECURRING_SLOT_BOOKING (slot ricorrenti), EVENT_NON_RECURRING_BOOKING (eventi con data specifica)';
