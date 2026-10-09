-- ============================================================
-- Migration 0058: Championship Match Convocations
-- Create table for managing player convocations for matches
-- ============================================================

-- Create table for convocations
CREATE TABLE IF NOT EXISTS public.championship_match_convocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.championship_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  convocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_by_user_id UUID REFERENCES public.profiles(id),
  
  CONSTRAINT unique_convocation UNIQUE(match_id, user_id),
  CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for queries
CREATE INDEX idx_convocations_match_id ON public.championship_match_convocations(match_id);
CREATE INDEX idx_convocations_user_id ON public.championship_match_convocations(user_id);
CREATE INDEX idx_convocations_created_at ON public.championship_match_convocations(convocated_at);

-- Enable RLS
ALTER TABLE public.championship_match_convocations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can see all convocations
CREATE POLICY "Admin can view all convocations"
  ON public.championship_match_convocations
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policy: Admins can create convocations
CREATE POLICY "Admin can create convocations"
  ON public.championship_match_convocations
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policy: Admins can delete convocations
CREATE POLICY "Admin can delete convocations"
  ON public.championship_match_convocations
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policy: Users can view convocations for their matches (if they're on the team)
CREATE POLICY "Team members can view convocations for their matches"
  ON public.championship_match_convocations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.championship_matches m
      INNER JOIN public.championship_team_players tp ON m.team_id = tp.team_id
      WHERE m.id = championship_match_convocations.match_id
      AND tp.user_id = auth.uid()
      AND tp.status = 'active'
    )
  );
