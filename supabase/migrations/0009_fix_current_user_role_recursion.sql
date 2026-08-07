-- ============================================================
-- Fix: stack depth limit exceeded (ricorsione infinita RLS)
--
-- 0007 aveva convertito current_user_role() a SECURITY INVOKER.
-- Essendo la funzione invocata dentro le policy RLS di "profiles"
-- (es. "profiles read", "admin manages settings", ecc.), con
-- SECURITY INVOKER la query SELECT dentro la funzione riattiva
-- la RLS su profiles, che richiama di nuovo current_user_role():
-- loop infinito -> "stack depth limit exceeded" su query con
-- join verso profiles (es. bookings -> profiles).
--
-- Fix: torna a SECURITY DEFINER (bypassa la RLS SOLO dentro la
-- funzione stessa) con search_path fissato per sicurezza.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public, anon, authenticated;
