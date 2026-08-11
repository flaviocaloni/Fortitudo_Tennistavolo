-- ============================================================
-- Sede evento e URL per gli slot evento.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.training_slots add column sede_evento text;
alter table public.training_slots add column url text;
