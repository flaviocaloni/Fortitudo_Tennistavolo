-- ============================================================
-- Giocatori di squadra campionato: championship_team_players
-- ============================================================

-- Enum per stato giocatore in squadra
CREATE TYPE public.player_status AS ENUM ('active', 'left', 'transferred');

-- Tabella giocatori assegnati a squadre
CREATE TABLE public.championship_team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  left_at date,
  status public.player_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_active_player_per_team UNIQUE (team_id, user_id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT valid_date_range CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Vincolo: solo agonisti possono essere assegnati
CREATE OR REPLACE FUNCTION public.enforce_agonista_only()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = new.user_id;
  IF v_role IS DISTINCT FROM 'agonista' THEN
    RAISE EXCEPTION 'Solo agonisti possono essere assegnati a squadre di campionato';
  END IF;
  RETURN new;
END; $$;

CREATE TRIGGER trg_enforce_agonista_only
  BEFORE INSERT OR UPDATE ON public.championship_team_players
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_agonista_only();

-- Vincolo: un agonista non può appartiene a più squadre nello stesso campionato
CREATE OR REPLACE FUNCTION public.enforce_single_team_per_championship()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_championship_id uuid;
  v_duplicate_count int;
BEGIN
  -- Recupera il championship_id della squadra attuale
  SELECT championship_id INTO v_championship_id
  FROM public.championship_teams WHERE id = new.team_id;

  -- Verifica se l'agonista appartiene già a un'altra squadra dello stesso campionato (attiva)
  SELECT COUNT(*) INTO v_duplicate_count
  FROM public.championship_team_players ctp
  JOIN public.championship_teams ct ON ct.id = ctp.team_id
  WHERE ct.championship_id = v_championship_id
    AND ctp.user_id = new.user_id
    AND ctp.status = 'active'
    AND ctp.id IS DISTINCT FROM new.id;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Questo agonista appartiene già a una squadra in questo campionato';
  END IF;

  RETURN new;
END; $$;

CREATE TRIGGER trg_enforce_single_team_per_championship
  BEFORE INSERT OR UPDATE ON public.championship_team_players
  FOR EACH ROW
  WHEN (new.status = 'active')
  EXECUTE FUNCTION public.enforce_single_team_per_championship();

-- Indici
CREATE INDEX idx_championship_team_players_team_id ON public.championship_team_players(team_id);
CREATE INDEX idx_championship_team_players_user_id ON public.championship_team_players(user_id);
CREATE INDEX idx_championship_team_players_status ON public.championship_team_players(status);

-- RLS: Championship Team Players
ALTER TABLE public.championship_team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "championship_team_players_read" ON public.championship_team_players
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "championship_team_players_admin" ON public.championship_team_players
  FOR ALL USING (public.current_user_role() = 'admin');

-- Trigger: aggiorna updated_at
CREATE OR REPLACE FUNCTION public.update_championship_team_player_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END; $$;

CREATE TRIGGER trg_championship_team_player_updated
  BEFORE UPDATE ON public.championship_team_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_championship_team_player_timestamp();

-- Audit per championship_team_players
CREATE TABLE public.championship_team_player_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.championship_team_players(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('assigned', 'status_changed', 'removed')),
  modified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_state jsonb,
  new_state jsonb,
  modified_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.audit_championship_team_player_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    INSERT INTO public.championship_team_player_audit (
      player_id, change_type, modified_by, new_state
    ) VALUES (
      new.id, 'assigned', auth.uid(), row_to_json(new)
    );
  ELSIF tg_op = 'UPDATE' THEN
    INSERT INTO public.championship_team_player_audit (
      player_id, change_type, modified_by, previous_state, new_state
    ) VALUES (
      new.id,
      CASE
        WHEN old.status IS DISTINCT FROM new.status THEN 'status_changed'
        ELSE 'status_changed'
      END,
      auth.uid(),
      row_to_json(old),
      row_to_json(new)
    );
  ELSIF tg_op = 'DELETE' THEN
    INSERT INTO public.championship_team_player_audit (
      player_id, change_type, modified_by, previous_state
    ) VALUES (
      old.id, 'removed', auth.uid(), row_to_json(old)
    );
  END IF;
  RETURN COALESCE(new, old);
END; $$;

CREATE TRIGGER trg_audit_championship_team_player
  AFTER INSERT OR UPDATE OR DELETE ON public.championship_team_players
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_championship_team_player_change();

CREATE INDEX idx_championship_team_player_audit_player_id ON public.championship_team_player_audit(player_id);
