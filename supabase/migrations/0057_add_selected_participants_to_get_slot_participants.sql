-- ============================================================
-- Add selected_participants to get_slot_participants RPC
-- Shows participant count for pizza slots in the modal
-- ============================================================

CREATE OR REPLACE FUNCTION get_slot_participants(slot_id_param UUID, session_date_param DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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
      'is_overbooking', b.is_overbooking,
      'selected_participants', COALESCE(b.selected_participants, 1)
    )
    ORDER BY b.is_overbooking ASC, b.created_at ASC
  ) INTO result
  FROM public.bookings b
  LEFT JOIN public.profiles p ON b.user_id = p.id
  WHERE b.slot_id = slot_id_param
    AND b.session_date = session_date_param
    AND b.status = 'active';

  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_slot_participants(UUID, DATE) TO anon, authenticated;
