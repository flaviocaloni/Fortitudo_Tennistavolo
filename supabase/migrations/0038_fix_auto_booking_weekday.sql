-- Migration: Fix Auto-Booking Weekday Calculation
-- Purpose: Fix incorrect weekday comparison in auto_book_recurring_slots RPC
-- Date: 2026-09-14
-- Problem: EXTRACT(DOW) returns 0=Sunday through 6=Saturday (same as weekday column)
--          Code was doing DOW - 1, which broke the comparison

-- Drop and recreate the RPC function with correct weekday logic
CREATE OR REPLACE FUNCTION public.auto_book_recurring_slots(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS jsonb AS $$
DECLARE
  v_slot RECORD;
  v_current_date date;
  v_bookings_created int := 0;
  v_bookings_skipped int := 0;
  v_bookings_failed int := 0;
  v_user_enabled boolean;
  v_slot_weekday int;
  v_booking_exists boolean;
  v_error_msg text;
BEGIN
  -- Verify auto-booking is enabled for this user
  SELECT auto_booking_enabled INTO v_user_enabled
  FROM public.user_auto_booking_enabled
  WHERE user_id = p_user_id;

  IF v_user_enabled IS NULL OR v_user_enabled = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Auto-booking not enabled for this user',
      'bookings_created', 0,
      'bookings_skipped', 0,
      'bookings_failed', 0
    );
  END IF;

  -- Loop through all enabled slots for this user
  FOR v_slot IN
    SELECT ts.id, ts.weekday
    FROM public.user_slot_auto_booking usab
    JOIN public.training_slots ts ON usab.slot_id = ts.id
    WHERE usab.user_id = p_user_id
      AND usab.enabled = true
      AND ts.weekday IS NOT NULL  -- Only recurring slots
      AND ts.is_active = true
  LOOP
    v_slot_weekday := v_slot.weekday;

    -- Generate all instances of this slot within date range
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
      -- Check if this date matches the slot's weekday
      -- EXTRACT(DOW) returns 0=Sunday, 1=Monday, ..., 6=Saturday (same as weekday column)
      IF EXTRACT(DOW FROM v_current_date)::int = v_slot_weekday THEN
        -- Check if booking already exists for this date
        SELECT EXISTS(
          SELECT 1 FROM public.bookings
          WHERE user_id = p_user_id
            AND slot_id = v_slot.id
            AND session_date = v_current_date
        ) INTO v_booking_exists;

        IF v_booking_exists THEN
          v_bookings_skipped := v_bookings_skipped + 1;
        ELSE
          -- Try to create booking (will be validated by trigger)
          BEGIN
            INSERT INTO public.bookings (user_id, slot_id, session_date, status)
            VALUES (p_user_id, v_slot.id, v_current_date, 'active');
            v_bookings_created := v_bookings_created + 1;
          EXCEPTION WHEN OTHERS THEN
            v_bookings_failed := v_bookings_failed + 1;
            v_error_msg := SQLERRM;
          END;
        END IF;
      END IF;

      v_current_date := v_current_date + interval '1 day';
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Auto-booking completed',
    'bookings_created', v_bookings_created,
    'bookings_skipped', v_bookings_skipped,
    'bookings_failed', v_bookings_failed,
    'error_detail', v_error_msg
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
