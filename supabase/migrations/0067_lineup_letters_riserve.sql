-- ============================================================
-- Migration 0067: aggiunge le riserve alle lettere della formazione
-- La 0059 ammetteva solo 'A', 'B', 'C'. Ora anche 'R1' (riserva 1) e 'R2' (riserva 2).
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

alter table public.championship_match_lineups
  drop constraint if exists championship_match_lineups_letter_check;

alter table public.championship_match_lineups
  add constraint championship_match_lineups_letter_check
  check (letter in ('A', 'B', 'C', 'R1', 'R2'));
