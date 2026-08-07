-- ============================================================
-- Numero tessera FITET (solo agonisti), impostabile solo da admin.
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.profiles add column fitet_card_number text;
