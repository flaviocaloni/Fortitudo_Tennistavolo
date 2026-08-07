-- ============================================================
-- Disattivazione utente senza eliminare i dati storicizzati.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.profiles add column is_active boolean not null default true;
