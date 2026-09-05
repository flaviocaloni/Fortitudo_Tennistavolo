-- Migration: Auto-Booking System for Recurring Slots
-- Purpose: Enable users to auto-book recurring training slots via daily cron job
-- Date: 2026-09-06
-- Details:
--   - Creates user_auto_booking_enabled table to track feature enablement
--   - Creates user_slot_auto_booking table to track which slots user wants auto-booked
--   - Creates RPC function to auto-book recurring slots for a user over date range

-- Table: Track which users have auto-booking feature enabled
CREATE TABLE public.user_auto_booking_enabled (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  auto_booking_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: Track which recurring slots each user wants to auto-book
CREATE TABLE public.user_slot_auto_booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES public.training_slots(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, slot_id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_auto_booking_enabled ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_slot_auto_booking ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read their own auto-booking settings
CREATE POLICY user_auto_booking_enabled_select_self ON public.user_auto_booking_enabled
  FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() = 'superadmin');

CREATE POLICY user_auto_booking_enabled_update_self ON public.user_auto_booking_enabled
  FOR UPDATE USING (auth.uid() = user_id OR public.current_user_role() = 'superadmin');

CREATE POLICY user_slot_auto_booking_select_self ON public.user_slot_auto_booking
  FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() = 'superadmin');

CREATE POLICY user_slot_auto_booking_insert_self ON public.user_slot_auto_booking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_slot_auto_booking_update_self ON public.user_slot_auto_booking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_slot_auto_booking_delete_self ON public.user_slot_auto_booking
  FOR DELETE USING (auth.uid() = user_id);

-- RPC: Auto-book recurring slots for a user over a date range
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
      -- Check if this date matches the slot's weekday (0=Mon, 6=Sun in Postgres)
      IF EXTRACT(DOW FROM v_current_date)::int - 1 = v_slot_weekday THEN
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

-- Grant execute on RPC to authenticated users (will be called by cron)
GRANT EXECUTE ON FUNCTION public.auto_book_recurring_slots(uuid, date, date) TO authenticated, anon;
