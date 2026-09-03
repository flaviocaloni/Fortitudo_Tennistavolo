-- ============================================================
-- Campionato: tabelle base championships e championship_teams
-- ============================================================

-- Enum per serie
CREATE TYPE public.championship_series AS ENUM ('D3', 'D2', 'D1', 'C2', 'C1');

-- Enum per stato campionato
CREATE TYPE public.championship_status AS ENUM ('draft', 'active', 'completed', 'archived');

-- Tabella campionati
CREATE TABLE public.championships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL UNIQUE REFERENCES public.seasons(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status public.championship_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_championship_per_season UNIQUE (season_id)
);

-- Tabella squadre di campionato
CREATE TABLE public.championship_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  name text NOT NULL,
  series public.championship_series NOT NULL,
  group_code text NOT NULL, -- A-Z, predisposto per future estensioni
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_team_name_per_championship UNIQUE (championship_id, name),
  CONSTRAINT valid_group_code CHECK (group_code ~ '^[A-Z]$')
);

-- Indici
CREATE INDEX idx_championships_season_id ON public.championships(season_id);
CREATE INDEX idx_championship_teams_championship_id ON public.championship_teams(championship_id);
CREATE INDEX idx_championship_teams_series ON public.championship_teams(series);
CREATE INDEX idx_championship_teams_group ON public.championship_teams(group_code);

-- RLS: Championships
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "championships_read" ON public.championships
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "championships_admin" ON public.championships
  FOR ALL USING (public.current_user_role() = 'admin');

-- RLS: Championship Teams
ALTER TABLE public.championship_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "championship_teams_read" ON public.championship_teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "championship_teams_admin" ON public.championship_teams
  FOR ALL USING (public.current_user_role() = 'admin');

-- Trigger: aggiorna updated_at per championships
CREATE OR REPLACE FUNCTION public.update_championship_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END; $$;

CREATE TRIGGER trg_championship_updated
  BEFORE UPDATE ON public.championships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_championship_timestamp();

-- Trigger: aggiorna updated_at per championship_teams
CREATE TRIGGER trg_championship_team_updated
  BEFORE UPDATE ON public.championship_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_championship_timestamp();

-- Audit per championships
CREATE TABLE public.championship_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'status_changed', 'deleted')),
  modified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_state jsonb,
  new_state jsonb,
  modified_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: registra audit log per championships
CREATE OR REPLACE FUNCTION public.audit_championship_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    INSERT INTO public.championship_audit (
      championship_id, change_type, modified_by, new_state
    ) VALUES (
      new.id, 'created', auth.uid(), row_to_json(new)
    );
  ELSIF tg_op = 'UPDATE' THEN
    INSERT INTO public.championship_audit (
      championship_id, change_type, modified_by, previous_state, new_state
    ) VALUES (
      new.id,
      CASE
        WHEN old.status IS DISTINCT FROM new.status THEN 'status_changed'
        ELSE 'updated'
      END,
      auth.uid(),
      row_to_json(old),
      row_to_json(new)
    );
  ELSIF tg_op = 'DELETE' THEN
    INSERT INTO public.championship_audit (
      championship_id, change_type, modified_by, previous_state
    ) VALUES (
      old.id, 'deleted', auth.uid(), row_to_json(old)
    );
  END IF;
  RETURN COALESCE(new, old);
END; $$;

CREATE TRIGGER trg_audit_championship
  AFTER INSERT OR UPDATE OR DELETE ON public.championships
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_championship_change();

-- Audit per championship_teams
CREATE TABLE public.championship_team_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'status_changed', 'deleted')),
  modified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_state jsonb,
  new_state jsonb,
  modified_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: registra audit log per championship_teams
CREATE OR REPLACE FUNCTION public.audit_championship_team_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    INSERT INTO public.championship_team_audit (
      team_id, change_type, modified_by, new_state
    ) VALUES (
      new.id, 'created', auth.uid(), row_to_json(new)
    );
  ELSIF tg_op = 'UPDATE' THEN
    INSERT INTO public.championship_team_audit (
      team_id, change_type, modified_by, previous_state, new_state
    ) VALUES (
      new.id,
      CASE
        WHEN old.status IS DISTINCT FROM new.status THEN 'status_changed'
        ELSE 'updated'
      END,
      auth.uid(),
      row_to_json(old),
      row_to_json(new)
    );
  ELSIF tg_op = 'DELETE' THEN
    INSERT INTO public.championship_team_audit (
      team_id, change_type, modified_by, previous_state
    ) VALUES (
      old.id, 'deleted', auth.uid(), row_to_json(old)
    );
  END IF;
  RETURN COALESCE(new, old);
END; $$;

CREATE TRIGGER trg_audit_championship_team
  AFTER INSERT OR UPDATE OR DELETE ON public.championship_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_championship_team_change();

-- Indici audit
CREATE INDEX idx_championship_audit_championship_id ON public.championship_audit(championship_id);
CREATE INDEX idx_championship_team_audit_team_id ON public.championship_team_audit(team_id);
