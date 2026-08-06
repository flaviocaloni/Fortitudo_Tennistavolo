-- ============================================================
-- Convert current_user_role to SECURITY INVOKER
-- More secure: user must have access to profiles table
-- ============================================================

create or replace function public.current_user_role()
returns public.user_role
language sql stable security invoker as $$
  select role from public.profiles where id = auth.uid();
$$;
