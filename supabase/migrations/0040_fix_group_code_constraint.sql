-- Migration: Fix group_code constraint (cleanup from 0039)
-- Purpose: Ensure group_code allows 1-5 alphanumeric characters
-- Date: 2026-09-25

-- Drop the constraint if it exists (using DO to avoid errors if it doesn't exist)
ALTER TABLE public.championship_teams
DROP CONSTRAINT IF EXISTS valid_group_code;

-- Add new constraint that allows 1-5 uppercase letters and numbers
ALTER TABLE public.championship_teams
ADD CONSTRAINT valid_group_code CHECK (group_code ~ '^[A-Z0-9]{1,5}$');
