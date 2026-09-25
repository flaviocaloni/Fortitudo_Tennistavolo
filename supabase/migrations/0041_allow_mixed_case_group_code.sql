-- Migration: Allow mixed case and spaces in group_code
-- Purpose: Allow group codes like "MI F", "mi f", "ABC 1", etc. (up to 5 chars)
-- Date: 2026-09-25

-- Drop the old constraint
ALTER TABLE public.championship_teams
DROP CONSTRAINT IF EXISTS valid_group_code;

-- Add new constraint that allows:
-- - Uppercase and lowercase letters (A-Z, a-z)
-- - Numbers (0-9)
-- - Spaces
-- Maximum 5 characters total
ALTER TABLE public.championship_teams
ADD CONSTRAINT valid_group_code CHECK (group_code ~ '^[A-Za-z0-9 ]{1,5}$');
