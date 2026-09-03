-- ============================================================
-- Partite di campionato: championship_matches
-- ============================================================

-- Enum per tipo gara (andata, ritorno, singola)
CREATE TYPE public.leg_type AS ENUM ('FIRST_LEG', 'RETURN_LEG', 'SINGLE');

-- Enum per sede (casa/trasferta)
CREATE TYPE public.venue_type AS ENUM ('HOME', 'AWAY');

-- Enum per stato partita
CREATE TYPE public.match_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- Tabella partite
CREATE TABLE public.championship_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  opponent_name text NOT NULL,
  opponent_club_name text,
  leg_type public.leg_type NOT NULL DEFAULT 'SINGLE',
  venue_type public.venue_type NOT NULL DEFAULT 'HOME',
  scheduled_start_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Rome',
  venue_name text,
  address text,
  status public.match_status NOT NULL DEFAULT 'SCHEDULED',
  notes text,
  result text, -- es: "4-3" (memorizza il risultato dopo la partita)
  return_match_id uuid REFERENCES public.championship_matches(id) ON DELETE SET NULL,
  calendar_event_id uuid, -- collegamento a eventuale evento calendario (future proof)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT valid_start_time CHECK (scheduled_start_at > created_at),
  CONSTRAINT return_match_different CHECK (return_match_id IS NULL OR return_match_id <> id)
);

-- Indici
CREATE INDEX idx_championship_matches_championship_id ON public.championship_matches(championship_id);
CREATE INDEX idx_championship_matches_team_id ON public.championship_matches(team_id);
CREATE INDEX idx_championship_matches_season_id ON public.championship_matches(season_id);
CREATE INDEX idx_championship_matches_scheduled_start ON public.championship_matches(scheduled_start_at);
CREATE INDEX idx_championship_matches_status ON public.championship_matches(status);

-- RLS: Championship Matches
ALTER TABLE public.championship_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "championship_matches_read" ON public.championship_matches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "championship_matches_admin" ON public.championship_matches
  FOR ALL USING (public.current_user_role() = 'admin');

-- Trigger: aggiorna updated_at
CREATE OR REPLACE FUNCTION public.update_championship_match_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END; $$;

CREATE TRIGGER trg_championship_match_updated
  BEFORE UPDATE ON public.championship_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_championship_match_timestamp();

-- Audit per championship_matches
CREATE TABLE public.championship_match_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.championship_matches(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'status_changed', 'result_added', 'deleted')),
  modified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_state jsonb,
  new_state jsonb,
  modified_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.audit_championship_match_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    INSERT INTO public.championship_match_audit (
      match_id, change_type, modified_by, new_state
    ) VALUES (
      new.id, 'created', auth.uid(), row_to_json(new)
    );
  ELSIF tg_op = 'UPDATE' THEN
    INSERT INTO public.championship_match_audit (
      match_id, change_type, modified_by, previous_state, new_state
    ) VALUES (
      new.id,
      CASE
        WHEN old.status IS DISTINCT FROM new.status THEN 'status_changed'
        WHEN old.result IS DISTINCT FROM new.result THEN 'result_added'
        ELSE 'updated'
      END,
      auth.uid(),
      row_to_json(old),
      row_to_json(new)
    );
  ELSIF tg_op = 'DELETE' THEN
    INSERT INTO public.championship_match_audit (
      match_id, change_type, modified_by, previous_state
    ) VALUES (
      old.id, 'deleted', auth.uid(), row_to_json(old)
    );
  END IF;
  RETURN COALESCE(new, old);
END; $$;

CREATE TRIGGER trg_audit_championship_match
  AFTER INSERT OR UPDATE OR DELETE ON public.championship_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_championship_match_change();

CREATE INDEX idx_championship_match_audit_match_id ON public.championship_match_audit(match_id);

-- Funzione: verifica se una partita è iniziata (per bloccare modifiche presenze dopo inizio)
CREATE OR REPLACE FUNCTION public.match_has_started(p_match_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (scheduled_start_at AT TIME ZONE timezone) < now()
  FROM public.championship_matches
  WHERE id = p_match_id;
$$;
