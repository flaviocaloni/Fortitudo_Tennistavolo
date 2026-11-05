-- ============================================================
-- Migration 0060: Lettura convocazioni e formazioni per utenti autenticati
-- Convocazioni e formazioni sono visibili a tutti gli utenti loggati (pagina convocazioni)
-- ============================================================

CREATE POLICY "Authenticated users can view convocations"
  ON public.championship_match_convocations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view lineups"
  ON public.championship_match_lineups
  FOR SELECT
  TO authenticated
  USING (true);
