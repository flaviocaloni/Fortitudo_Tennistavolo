-- ============================================================
-- Migration 0059: Championship Match Lineups
-- Formazione per partita: lettera singolare (A/B/C) e doppio (si/no) per giocatore
-- ============================================================

CREATE TABLE IF NOT EXISTS public.championship_match_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.championship_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  letter TEXT CHECK (letter IN ('A', 'B', 'C')),
  is_doubles BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_lineup_player UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON public.championship_match_lineups(match_id);

ALTER TABLE public.championship_match_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view lineups"
  ON public.championship_match_lineups
  FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can create lineups"
  ON public.championship_match_lineups
  FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update lineups"
  ON public.championship_match_lineups
  FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete lineups"
  ON public.championship_match_lineups
  FOR DELETE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
