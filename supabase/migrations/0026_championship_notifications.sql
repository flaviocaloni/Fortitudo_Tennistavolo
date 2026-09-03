-- ============================================================
-- Notifiche per campionato: aggiungere CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED
-- ============================================================

-- Aggiungere il nuovo codice notifica all'enum
ALTER TYPE public.notification_code ADD VALUE IF NOT EXISTS 'CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED';

-- Inserire la configurazione notifica iniziale (disattivata)
-- Nota: usa DO block per evitare errore di enum non ancora committed
DO $$
BEGIN
  INSERT INTO public.notification_configs (
    notification_code,
    is_active,
    delivery_channel,
    recipient_mode
  ) VALUES (
    'CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED'::public.notification_code,
    false,
    'EMAIL',
    'ALL_ADMINS'::public.recipient_mode
  ) ON CONFLICT (notification_code) DO NOTHING;
END $$;

-- Tabella per tracciare gli eventi di notifica (per idempotenza)
CREATE TABLE IF NOT EXISTS public.championship_attendance_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_history_id uuid NOT NULL REFERENCES public.championship_attendance_history(id) ON DELETE CASCADE,
  notification_config_id bigint NOT NULL REFERENCES public.notification_configs(id) ON DELETE CASCADE,
  match_id uuid NOT NULL,
  player_id uuid NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status_transition CHECK (
    status IN ('pending', 'sent', 'failed', 'skipped')
  )
);

CREATE INDEX idx_championship_attendance_notification_events_match_player
  ON public.championship_attendance_notification_events(match_id, player_id);
CREATE INDEX idx_championship_attendance_notification_events_status
  ON public.championship_attendance_notification_events(status);

-- RLS: solo admin e il trigger (security definer) possono accedere
ALTER TABLE public.championship_attendance_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "championship_attendance_notification_events_admin_read"
  ON public.championship_attendance_notification_events
  FOR SELECT USING (public.current_user_role() = 'admin');

CREATE POLICY "championship_attendance_notification_events_insert_trigger_only"
  ON public.championship_attendance_notification_events
  FOR INSERT WITH CHECK (true);

-- Funzione: crea evento notifica quando presenza passa da PRESENT a ABSENT
CREATE OR REPLACE FUNCTION public.trigger_championship_attendance_notification()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_notification_config RECORD;
  v_match_id uuid;
  v_idempotency_key text;
BEGIN
  -- Solo se la transizione è PRESENT -> ABSENT
  IF new.previous_status = 'PRESENT' AND new.new_status = 'ABSENT' THEN
    -- Recupera match_id dallo storico
    SELECT match_id INTO v_match_id FROM public.championship_attendance_history
    WHERE id = new.attendance_history_id;

    -- Recupera configurazione notifica
    SELECT * INTO v_notification_config FROM public.notification_configs
    WHERE notification_code = 'CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED'
      AND is_active = true;

    IF v_notification_config IS NOT NULL THEN
      -- Genera idempotency key
      v_idempotency_key := MD5(
        v_notification_config.id::text ||
        v_match_id::text ||
        new.user_id::text ||
        new.id::text ||
        'ATTENDANCE_REMOVED'
      );

      -- Crea evento di notifica (per processing asincrono o sincrono)
      INSERT INTO public.championship_attendance_notification_events (
        attendance_history_id,
        notification_config_id,
        match_id,
        player_id,
        idempotency_key,
        status
      ) VALUES (
        new.id,
        v_notification_config.id,
        v_match_id,
        new.user_id,
        v_idempotency_key,
        'pending'
      )
      ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;
  END IF;
  RETURN new;
END; $$;

-- Trigger: crea evento notifica su cambio storico presenze
CREATE TRIGGER trg_trigger_championship_attendance_notification
  AFTER INSERT ON public.championship_attendance_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_championship_attendance_notification();
