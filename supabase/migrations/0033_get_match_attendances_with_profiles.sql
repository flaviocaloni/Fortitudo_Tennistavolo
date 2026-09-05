-- Migration: Get Match Attendances with Profiles
-- Purpose: RPC to fetch match attendances joined with player profile names
-- Date: 2026-09-05
-- Details:
--   - Fixes non-admin view: the "Presenze" list was showing raw UUIDs / looked
--     empty because the embedded `profiles(...)` join is filtered by the
--     profiles RLS policy (a non-admin can only read their own profile row).
--   - Uses SECURITY DEFINER (same pattern as get_team_players_with_profiles)
--     to bypass the profiles RLS for the name lookup only.
--   - Builds the list from ALL active team players LEFT JOIN attendances, so
--     every agonista appears even for matches created before the auto-create
--     trigger (0029) existed. Missing records default to 'PRESENT' (the same
--     default the trigger uses), which keeps the Presenti/Assenti counters
--     consistent.
--   - Access guard: only admins or active members of the match's team can read.

DROP FUNCTION IF EXISTS get_match_attendances_with_profiles(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_match_attendances_with_profiles(match_id_param UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  v_team_id UUID;
  v_is_admin BOOLEAN;
  v_is_member BOOLEAN;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- Resolve the team for this match
  SELECT team_id INTO v_team_id
  FROM championship_matches
  WHERE id = match_id_param;

  IF v_team_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- Access guard (null-safe: a missing profile role must not bypass the check)
  v_is_admin := COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin',
    false
  );
  v_is_member := EXISTS (
    SELECT 1 FROM championship_team_players
    WHERE team_id = v_team_id
      AND user_id = auth.uid()
      AND status = 'active'::player_status
  );

  IF NOT (v_is_admin OR v_is_member) THEN
    RETURN '[]'::json;
  END IF;

  -- All active team players, with their attendance record if present
  SELECT json_agg(row_data ORDER BY full_name ASC NULLS LAST) INTO result
  FROM (
    SELECT
      json_build_object(
        'id', a.id,
        'match_id', match_id_param,
        'user_id', ctp.user_id,
        'status', COALESCE(a.status::text, 'PRESENT'),
        'change_source', a.change_source::text,
        'profiles', json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'role', p.role
        )
      ) AS row_data,
      p.full_name AS full_name
    FROM championship_team_players ctp
    LEFT JOIN profiles p ON ctp.user_id = p.id
    LEFT JOIN championship_match_attendances a
      ON a.match_id = match_id_param AND a.user_id = ctp.user_id
    WHERE ctp.team_id = v_team_id
      AND ctp.status = 'active'::player_status
  ) sub;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_match_attendances_with_profiles(UUID) TO anon, authenticated;
