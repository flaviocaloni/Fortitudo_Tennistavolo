-- Migration: Auto-Create Match Attendances on Match Insert
-- Purpose: Automatically add all team players as PRESENT when a championship match is created
-- Date: 2026-09-04
-- Details:
--   - Trigger fires AFTER INSERT on championship_matches table
--   - Inserts attendance record for each active player in the match's team
--   - All players are initially marked as PRESENT (status = 'PRESENT')
--   - change_source set to 'SYSTEM' to indicate automatic creation
--   - Players can later update their own status via updateMyAttendance action
--   - Admin can override status via updateAdminAttendance action

CREATE OR REPLACE FUNCTION create_match_attendances()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert attendance records for all active players in the team
  INSERT INTO championship_match_attendances (match_id, user_id, status, change_source, created_at)
  SELECT NEW.id, user_id, 'PRESENT', 'SYSTEM', NOW()
  FROM championship_team_players
  WHERE team_id = NEW.team_id AND status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_match_attendances ON championship_matches;

-- Create trigger to auto-populate attendances
CREATE TRIGGER trigger_create_match_attendances
AFTER INSERT ON championship_matches
FOR EACH ROW
EXECUTE FUNCTION create_match_attendances();
