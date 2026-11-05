-- ============================================================
-- Migration 0061: Convocati e formazioni con nomi per utenti autenticati
-- La RLS di profiles nasconde i nomi agli utenti non admin: la funzione
-- legge solo i campi necessari (nome, convocazione/formazione) con SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_match_roster_public(match_ids UUID[])
RETURNS TABLE (
  match_id UUID,
  user_id UUID,
  full_name TEXT,
  letter TEXT,
  is_doubles BOOLEAN,
  is_lineup BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.match_id, c.user_id, p.full_name, NULL::TEXT, FALSE, FALSE
  FROM championship_match_convocations c
  JOIN profiles p ON p.id = c.user_id
  WHERE auth.uid() IS NOT NULL AND c.match_id = ANY(match_ids)
  UNION ALL
  SELECT l.match_id, l.user_id, p.full_name, l.letter, l.is_doubles, TRUE
  FROM championship_match_lineups l
  JOIN profiles p ON p.id = l.user_id
  WHERE auth.uid() IS NOT NULL AND l.match_id = ANY(match_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_match_roster_public(UUID[]) TO authenticated;
