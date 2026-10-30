-- ============================================================
-- Migration 0060: Lettura formazioni per utenti autenticati
-- Le formazioni sono pubbliche per gli utenti loggati (pagina convocazioni)
-- ============================================================

CREATE POLICY "Authenticated users can view lineups"
  ON public.championship_match_lineups
  FOR SELECT
  TO authenticated
  USING (true);
