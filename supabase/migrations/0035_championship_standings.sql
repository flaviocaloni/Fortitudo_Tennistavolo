-- Migration: Championship Standings and Scoring System
-- Purpose: Track match results and calculate team points based on scoring rules
-- Date: 2026-09-06
-- Details:
--   - New table: championship_standings (tracks team points per championship)
--   - RPC: refresh_championship_standings (recalculates points from completed matches)
--   - Trigger: auto-refresh standings when match result is set
--   - Scoring rules: win with 7,6,5 → 3pts; with 4 → 2pts; with 3 → 1pt; else → 0pts
--   - Result format: "X-Y" where X is team score, Y is opponent score

-- ============================================================
-- Tabella: Championship Standings
-- ============================================================

CREATE TABLE public.championship_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_standings_per_championship UNIQUE (championship_id, team_id)
);

CREATE INDEX idx_championship_standings_championship_id
  ON public.championship_standings(championship_id);
CREATE INDEX idx_championship_standings_team_id
  ON public.championship_standings(team_id);
CREATE INDEX idx_championship_standings_points
  ON public.championship_standings(points DESC);

ALTER TABLE public.championship_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standings_read" ON public.championship_standings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "standings_admin" ON public.championship_standings
  FOR ALL USING (public.current_user_role() = 'admin');

-- ============================================================
-- RPC Function: Refresh Championship Standings
-- ============================================================

DROP FUNCTION IF EXISTS public.refresh_championship_standings(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.refresh_championship_standings(championship_id_param UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team_id UUID;
  v_home_score INT;
  v_away_score INT;
  v_points INT;
  match_record RECORD;
BEGIN
  -- Delete existing standings for this championship (will rebuild)
  DELETE FROM championship_standings WHERE championship_id = championship_id_param;

  -- Process each completed match with a result
  FOR match_record IN
    SELECT
      cm.id,
      cm.team_id,
      cm.result,
      cm.status
    FROM championship_matches cm
    WHERE cm.championship_id = championship_id_param
      AND cm.status = 'COMPLETED'
      AND cm.result IS NOT NULL
    ORDER BY cm.scheduled_start_at ASC
  LOOP
    -- Parse result string "X-Y" where X is team score, Y is opponent score
    BEGIN
      v_home_score := (string_to_array(match_record.result, '-'))[1]::INT;
      v_away_score := (string_to_array(match_record.result, '-'))[2]::INT;
    EXCEPTION WHEN OTHERS THEN
      -- Skip if result format is invalid
      CONTINUE;
    END;

    -- Calculate points for home team based on scoring rules
    IF v_home_score > v_away_score THEN
      -- Home team wins: calculate points by winning margin
      IF v_home_score >= 5 THEN
        v_points := 3;  -- Won with 5, 6, or 7
      ELSIF v_home_score = 4 THEN
        v_points := 2;  -- Won with 4
      ELSIF v_home_score = 3 THEN
        v_points := 1;  -- Won with 3
      ELSE
        v_points := 0;  -- Won with 2 or 1 (unusual but handle)
      END IF;
    ELSE
      -- Home team lost or drew (draw = 0 points)
      v_points := 0;
    END IF;

    -- Insert or update standings for home team
    INSERT INTO championship_standings (
      championship_id, team_id, matches_played, wins, losses, points
    ) VALUES (
      championship_id_param,
      match_record.team_id,
      1,
      CASE WHEN v_home_score > v_away_score THEN 1 ELSE 0 END,
      CASE WHEN v_home_score < v_away_score THEN 1 ELSE 0 END,
      v_points
    ) ON CONFLICT (championship_id, team_id) DO UPDATE SET
      matches_played = championship_standings.matches_played + 1,
      wins = championship_standings.wins + CASE WHEN v_home_score > v_away_score THEN 1 ELSE 0 END,
      losses = championship_standings.losses + CASE WHEN v_home_score < v_away_score THEN 1 ELSE 0 END,
      points = championship_standings.points + v_points,
      updated_at = now();

  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_championship_standings(UUID) TO anon, authenticated;

-- ============================================================
-- Trigger: Auto-refresh standings on match result update
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_refresh_standings_on_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Only refresh if result changed and new result is not null
  IF (OLD.result IS DISTINCT FROM NEW.result AND NEW.result IS NOT NULL) THEN
    PERFORM refresh_championship_standings(NEW.championship_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_refresh_standings_on_result
  ON public.championship_matches;

CREATE TRIGGER trigger_refresh_standings_on_result
  AFTER UPDATE ON public.championship_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_standings_on_result();

-- ============================================================
-- Trigger: Auto-refresh standings on status change to COMPLETED
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_refresh_standings_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh if status just changed to COMPLETED and result exists
  IF (OLD.status IS DISTINCT FROM NEW.status
      AND NEW.status = 'COMPLETED'
      AND NEW.result IS NOT NULL) THEN
    PERFORM refresh_championship_standings(NEW.championship_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_refresh_standings_on_completion
  ON public.championship_matches;

CREATE TRIGGER trigger_refresh_standings_on_completion
  AFTER UPDATE ON public.championship_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_standings_on_completion();
