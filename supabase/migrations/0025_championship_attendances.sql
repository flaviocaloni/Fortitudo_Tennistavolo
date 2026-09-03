-- ============================================================
-- Presenze agonisti nelle partite: championship_match_attendances
-- ============================================================

-- Enum per stato presenza
CREATE TYPE public.attendance_status AS ENUM ('PRESENT', 'ABSENT');

-- Enum per fonte cambiamento presenza
CREATE TYPE public.attendance_change_source AS ENUM (
  'DEFAULT_TEAM_ASSIGNMENT',
  'PLAYER',
  'ADMIN',
  'SYSTEM'
);

-- Tabella presenze partita
CREATE TABLE public.championship_match_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.championship_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'PRESENT',
  changed_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_source public.attendance_change_source NOT NULL DEFAULT 'SYSTEM',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_attendance_per_match UNIQUE (match_id, user_id)
);

-- Indici
CREATE INDEX idx_championship_match_attendances_match_id ON public.championship_match_attendances(match_id);
CREATE INDEX idx_championship_match_attendances_user_id ON public.championship_match_attendances(user_id);
CREATE INDEX idx_championship_match_attendances_status ON public.championship_match_attendances(status);

-- RLS: Championship Match Attendances
ALTER TABLE public.championship_match_attendances ENABLE ROW LEVEL SECURITY;

-- Lettura: tutti gli autenticati vedono i presenti
CREATE POLICY "championship_match_attendances_read" ON public.championship_match_attendances
  FOR SELECT USING (auth.role() = 'authenticated');

-- Inserimento e aggiornamento: agonista modifica solo la propria, admin modifica tutte
CREATE POLICY "championship_match_attendances_agonista_update_own" ON public.championship_match_attendances
  FOR UPDATE USING (
    user_id = auth.uid() AND
    public.current_user_role() = 'agonista'
  );

CREATE POLICY "championship_match_attendances_insert" ON public.championship_match_attendances
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'admin' OR
    user_id = auth.uid()
  );

CREATE POLICY "championship_match_attendances_admin" ON public.championship_match_attendances
  FOR ALL USING (public.current_user_role() = 'admin');

-- Trigger: aggiorna updated_at
CREATE OR REPLACE FUNCTION public.update_championship_match_attendance_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END; $$;

CREATE TRIGGER trg_championship_match_attendance_updated
  BEFORE UPDATE ON public.championship_match_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_championship_match_attendance_timestamp();

-- Storico presenze (audit)
CREATE TABLE public.championship_attendance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES public.championship_match_attendances(id) ON DELETE CASCADE,
  match_id uuid NOT NULL,
  user_id uuid NOT NULL,
  previous_status public.attendance_status NOT NULL,
  new_status public.attendance_status NOT NULL,
  changed_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_source public.attendance_change_source NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_change_different CHECK (previous_status IS DISTINCT FROM new_status)
);

-- Indici storico
CREATE INDEX idx_championship_attendance_history_attendance_id ON public.championship_attendance_history(attendance_id);
CREATE INDEX idx_championship_attendance_history_match_id ON public.championship_attendance_history(match_id);
CREATE INDEX idx_championship_attendance_history_user_id ON public.championship_attendance_history(user_id);

-- Trigger: registra storico presenze
CREATE OR REPLACE FUNCTION public.log_championship_attendance_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_op = 'UPDATE' AND old.status IS DISTINCT FROM new.status THEN
    INSERT INTO public.championship_attendance_history (
      attendance_id,
      match_id,
      user_id,
      previous_status,
      new_status,
      changed_by_user_id,
      change_source
    ) VALUES (
      new.id,
      new.match_id,
      new.user_id,
      old.status,
      new.status,
      new.changed_by_user_id,
      new.change_source
    );
  END IF;
  RETURN new;
END; $$;

CREATE TRIGGER trg_log_championship_attendance
  AFTER UPDATE ON public.championship_match_attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.log_championship_attendance_change();

-- RLS: Championship Attendance History (lettura per admin e utente stesso)
ALTER TABLE public.championship_attendance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "championship_attendance_history_read" ON public.championship_attendance_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.current_user_role() = 'admin'
  );

-- Funzione: inizializza presenze PRESENT di default per nuova partita
CREATE OR REPLACE FUNCTION public.initialize_match_attendances()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player RECORD;
BEGIN
  -- Recupera tutti i giocatori attivi della squadra
  FOR v_player IN
    SELECT user_id FROM public.championship_team_players
    WHERE team_id = new.team_id AND status = 'active'
  LOOP
    INSERT INTO public.championship_match_attendances (
      match_id,
      user_id,
      status,
      change_source,
      changed_by_user_id
    ) VALUES (
      new.id,
      v_player.user_id,
      'PRESENT',
      'DEFAULT_TEAM_ASSIGNMENT',
      auth.uid()
    )
    ON CONFLICT (match_id, user_id) DO NOTHING;
  END LOOP;
  RETURN new;
END; $$;

-- Trigger: al create di partita, inizializza presenze
CREATE TRIGGER trg_initialize_match_attendances
  AFTER INSERT ON public.championship_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_match_attendances();

-- Funzione: aggiunge nuovo agonista come PRESENT alle partite future
CREATE OR REPLACE FUNCTION public.add_player_to_future_matches()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match RECORD;
BEGIN
  -- Se lo stato diventa 'active', aggiungi il giocatore alle partite future della squadra
  IF new.status = 'active' THEN
    FOR v_match IN
      SELECT id FROM public.championship_matches
      WHERE team_id = new.team_id
        AND status IN ('SCHEDULED', 'POSTPONED')
        AND scheduled_start_at > now()
    LOOP
      INSERT INTO public.championship_match_attendances (
        match_id,
        user_id,
        status,
        change_source,
        changed_by_user_id
      ) VALUES (
        v_match.id,
        new.user_id,
        'PRESENT',
        'DEFAULT_TEAM_ASSIGNMENT',
        auth.uid()
      )
      ON CONFLICT (match_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  RETURN new;
END; $$;

-- Trigger: al assign di nuovo agonista, aggiungilo alle partite future
CREATE TRIGGER trg_add_player_to_future_matches
  AFTER INSERT OR UPDATE ON public.championship_team_players
  FOR EACH ROW
  EXECUTE FUNCTION public.add_player_to_future_matches();
