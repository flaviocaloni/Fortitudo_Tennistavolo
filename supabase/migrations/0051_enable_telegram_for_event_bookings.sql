-- ============================================================
-- Abilita Telegram per notifiche eventi non ricorrenti
-- ============================================================

UPDATE public.notification_configs
SET telegram_enabled = true
WHERE notification_code = 'EVENT_NON_RECURRING_BOOKING';
