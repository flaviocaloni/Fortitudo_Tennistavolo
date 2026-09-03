-- ============================================================
-- Inserisci configurazione notifica CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED
-- (separato da 0026 per permettere commit del nuovo valore enum)
-- ============================================================

INSERT INTO public.notification_configs (
  notification_code,
  is_active,
  delivery_channel,
  recipient_mode
) VALUES (
  'CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED',
  false,
  'EMAIL',
  'ALL_ADMINS'
) ON CONFLICT (notification_code) DO NOTHING;
