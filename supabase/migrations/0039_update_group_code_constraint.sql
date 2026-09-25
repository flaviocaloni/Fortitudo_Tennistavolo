-- Migration: Update group_code constraint to allow up to 5 characters
-- Purpose: Allow group codes like "A", "B1", "C2", etc. up to 5 characters
-- Date: 2026-09-25

-- Drop the old constraint that only allows single character
ALTER TABLE public.championship_teams
DROP CONSTRAINT valid_group_code;

-- Add new constraint that allows 1-5 uppercase letters
ALTER TABLE public.championship_teams
ADD CONSTRAINT valid_group_code CHECK (group_code ~ '^[A-Z]{1,5}$');
