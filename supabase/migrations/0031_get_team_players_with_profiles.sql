-- Migration: Get Team Players with Profiles
-- Purpose: RPC function to safely fetch team players with their profile data
-- Date: 2026-09-05
-- Details:
--   - Fetches team players with full profile information in JSON format
--   - Uses LEFT JOIN to include players even if profile data is incomplete
--   - Handles RLS by executing as SECURITY DEFINER
--   - Returns JSON array for compatibility with Supabase client

DROP FUNCTION IF EXISTS get_team_players_with_profiles(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_team_players_with_profiles(team_id_param UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', ctp.id,
      'user_id', ctp.user_id,
      'team_id', ctp.team_id,
      'status', ctp.status::text,
      'joined_at', ctp.joined_at,
      'profile_id', p.id,
      'full_name', p.full_name,
      'role', p.role
    ) ORDER BY ctp.joined_at ASC
  ) INTO result
  FROM championship_team_players ctp
  LEFT JOIN profiles p ON ctp.user_id = p.id
  WHERE ctp.team_id = team_id_param
    AND ctp.status = 'active'::player_status;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_team_players_with_profiles(UUID) TO anon, authenticated;
