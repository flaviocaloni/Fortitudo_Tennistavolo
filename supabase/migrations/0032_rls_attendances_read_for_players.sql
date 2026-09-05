-- Migration: RLS Policy for Match Attendances Read Access
-- Purpose: Allow players to view attendances for their team's matches
-- Date: 2026-09-05
-- Details:
--   - Players can view attendances for matches of their team
--   - Admin can view all attendances
--   - Maintains privacy: players see only their team's matches

-- Drop existing policies
DROP POLICY IF EXISTS "Players can view attendances for their matches" ON public.championship_match_attendances;

-- Allow players to view attendances for their team's matches
CREATE POLICY "Players can view attendances for their team matches"
  ON public.championship_match_attendances
  FOR SELECT
  USING (
    -- Admin can view all
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Players can view attendances for matches of their teams
    match_id IN (
      SELECT cma.match_id
      FROM public.championship_match_attendances cma
      JOIN public.championship_matches cm ON cma.match_id = cm.id
      JOIN public.championship_team_players ctp ON cm.team_id = ctp.team_id
      WHERE ctp.user_id = auth.uid()
        AND ctp.status = 'active'
        AND cma.match_id IN (
          SELECT id FROM public.championship_matches
          WHERE team_id IN (
            SELECT team_id FROM public.championship_team_players
            WHERE user_id = auth.uid() AND status = 'active'
          )
        )
    )
  );

-- Allow players to update their own attendance (already exists but ensure it's correct)
DROP POLICY IF EXISTS "Players can update their own attendance" ON public.championship_match_attendances;

CREATE POLICY "Players can update their own attendance"
  ON public.championship_match_attendances
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      -- Can only update if match hasn't started
      (SELECT scheduled_start_at FROM public.championship_matches WHERE id = match_id) > NOW()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Can only update if match hasn't started
      (SELECT scheduled_start_at FROM public.championship_matches WHERE id = match_id) > NOW()
    )
  );

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access to attendances" ON public.championship_match_attendances;

CREATE POLICY "Admin full access to attendances"
  ON public.championship_match_attendances
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
