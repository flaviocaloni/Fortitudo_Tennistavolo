-- Migration: Get Slot Participants
-- Purpose: RPC to list participants of a training slot/session for any authenticated user
-- Date: 2026-09-05
-- Details:
--   - The participants modal showed only the logged-in user because the
--     `bookings read` RLS policy (0001) restricts non-admins to their own rows
--     (user_id = auth.uid()), and the profiles join is also RLS-filtered.
--   - Uses SECURITY DEFINER (same pattern as get_match_attendances_with_profiles /
--     get_team_players_with_profiles) to return the full participant list with names.
--   - Access guard: any authenticated user may view a slot's participants
--     (shared club info); anonymous callers get an empty list.

DROP FUNCTION IF EXISTS get_slot_participants(UUID, DATE) CASCADE;

CREATE OR REPLACE FUNCTION get_slot_participants(slot_id_param UUID, session_date_param DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT json_agg(
    json_build_object(
      'full_name', COALESCE(p.full_name, '—'),
      'role', COALESCE(p.role::text, '—'),
      'is_overbooking', b.is_overbooking
    )
    ORDER BY b.is_overbooking ASC, b.created_at ASC
  ) INTO result
  FROM bookings b
  LEFT JOIN profiles p ON b.user_id = p.id
  WHERE b.slot_id = slot_id_param
    AND b.session_date = session_date_param
    AND b.status = 'active';

  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_slot_participants(UUID, DATE) TO anon, authenticated;
