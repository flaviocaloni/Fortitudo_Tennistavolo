-- ============================================================
-- Aggiungi campi Girone e Serie ai profili utenti.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.profiles add column girone text;
alter table public.profiles add column serie text;
