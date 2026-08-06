-- ============================================================
-- Fix SECURITY DEFINER Function Permissions
-- Restrict public/unauthenticated access to sensitive functions
-- ============================================================

-- ========== TRIGGER FUNCTIONS ==========
-- These should ONLY execute via triggers, not be directly callable
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

revoke execute on function public.protect_profile_fields() from anon;
revoke execute on function public.protect_profile_fields() from authenticated;

revoke execute on function public.check_booking_valid() from anon;
revoke execute on function public.check_booking_valid() from authenticated;

revoke execute on function public.log_booking_change() from anon;
revoke execute on function public.log_booking_change() from authenticated;

-- ========== HELPER FUNCTIONS ==========
-- Internal helpers: revoke from all user roles
-- (other SECURITY DEFINER functions can still call them internally)
revoke all on function public.current_user_role() from public, anon, authenticated;

-- rls_auto_enable: restrict to authenticated (used internally)
revoke all on function public.rls_auto_enable() from public;
grant execute on function public.rls_auto_enable() to authenticated;

-- ========== VIEW FUNCTIONS ==========
-- slot_occupancy: allow authenticated users to query availability
revoke execute on function public.slot_occupancy(date, date) from anon;
