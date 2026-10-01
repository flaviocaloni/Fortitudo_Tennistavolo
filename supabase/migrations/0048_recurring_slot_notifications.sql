-- ============================================================
-- Aggiungi notification_code per slot ricorrenti (training sessions)
-- ============================================================

-- STEP 1: Aggiorna enum notification_code per includere RECURRING
-- Nota: Questo deve essere eseguito PRIMA dell'INSERT
ALTER TYPE public.notification_code ADD VALUE 'RECURRING_SLOT_BOOKING' BEFORE 'EVENT_NON_RECURRING_BOOKING';
