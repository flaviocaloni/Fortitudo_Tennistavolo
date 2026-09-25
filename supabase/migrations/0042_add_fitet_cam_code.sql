-- Migration 0042: Add FITET CAM code to championship teams
-- Purpose: Store FITET championship code for each team for linking to official classifica/risultati

ALTER TABLE public.championship_teams
ADD COLUMN fitet_cam_code INTEGER;

CREATE INDEX idx_championship_teams_fitet_cam_code
  ON public.championship_teams(fitet_cam_code);
