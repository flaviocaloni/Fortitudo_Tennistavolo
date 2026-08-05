-- ============================================================
-- Fix SECURITY DEFINER Function Permissions
-- Restrict unauthenticated access, keep authenticated users only
-- ============================================================

-- Trigger functions: revoke EXECUTE from unauthenticated users
-- They only run via triggers, not direct calls
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.protect_profile_fields() from anon;
revoke execute on function public.check_booking_valid() from anon;
revoke execute on function public.log_booking_change() from anon;

-- Helper function: only authenticated users can call it
revoke execute on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;

-- View function: authenticated users only
revoke execute on function public.slot_occupancy(date, date) from anon;
grant execute on function public.slot_occupancy(date, date) to authenticated;

-- Trigger functions: also revoke from authenticated users
-- These should ONLY execute via triggers, never directly by users
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.protect_profile_fields() from authenticated;
revoke execute on function public.check_booking_valid() from authenticated;
revoke execute on function public.log_booking_change() from authenticated;

-- rls_auto_enable: restrict to authenticated only (helper function)
revoke execute on function public.rls_auto_enable() from anon;
grant execute on function public.rls_auto_enable() to authenticated;
