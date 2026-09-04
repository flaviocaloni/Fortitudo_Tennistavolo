-- Migration: Delete Championship Match with Cascade
-- Purpose: RPC function to safely delete a championship match and all related records
-- Date: 2026-09-04
-- Details:
--   - Disables user triggers on three tables before deletion
--   - Deletes records in correct order to avoid FK constraint violations
--   - Re-enables triggers after deletion
--   - Used to handle deletion of championship_match_audit, championship_match_attendances, and championship_matches

DROP FUNCTION IF EXISTS delete_championship_match(UUID);

CREATE OR REPLACE FUNCTION delete_championship_match(match_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Temporarily disable user triggers on affected tables
  ALTER TABLE championship_match_audit DISABLE TRIGGER USER;
  ALTER TABLE championship_matches DISABLE TRIGGER USER;
  ALTER TABLE championship_match_attendances DISABLE TRIGGER USER;

  -- Delete in reverse order of foreign key dependencies
  DELETE FROM championship_match_audit WHERE match_id = match_id_param;
  DELETE FROM championship_match_attendances WHERE match_id = match_id_param;
  DELETE FROM championship_matches WHERE id = match_id_param;

  -- Re-enable triggers
  ALTER TABLE championship_match_audit ENABLE TRIGGER USER;
  ALTER TABLE championship_matches ENABLE TRIGGER USER;
  ALTER TABLE championship_match_attendances ENABLE TRIGGER USER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION delete_championship_match(UUID) TO anon, authenticated;
