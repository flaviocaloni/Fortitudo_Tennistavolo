-- Migration: Get Team Players with Profiles
-- Purpose: RPC function to safely fetch team players with their profile data
-- Date: 2026-09-04
-- Details:
--   - Fetches team players with full profile information
--   - Uses LEFT JOIN to include players even if profile data is incomplete
--   - Handles RLS by executing as SECURITY DEFINER

CREATE OR REPLACE FUNCTION get_team_players_with_profiles(team_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  team_id UUID,
  status TEXT,
  joined_at DATE,
  profile_id UUID,
  full_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ctp.id,
    ctp.user_id,
    ctp.team_id,
    ctp.status,
    ctp.joined_at,
    p.id,
    p.full_name,
    p.role
  FROM championship_team_players ctp
  LEFT JOIN profiles p ON ctp.user_id = p.id
  WHERE ctp.team_id = team_id_param
    AND ctp.status = 'active'
  ORDER BY ctp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_team_players_with_profiles(UUID) TO anon, authenticated;
