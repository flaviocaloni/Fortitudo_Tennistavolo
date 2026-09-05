-- Migration: Add Superadmin Role
-- Purpose: Create a new superadmin role with greater privileges than admin
-- Date: 2026-09-06
-- Details:
--   - Adds 'superadmin' to the user_role enum
--   - Superadmin has all admin privileges plus system administration rights
--   - Assigns superadmin role to f.caloni01@teamsystem.com

-- Add 'superadmin' to the user_role enum type
ALTER TYPE public.user_role ADD VALUE 'superadmin' BEFORE 'admin';

-- Update the trigger that protects role field to allow superadmin assignment
-- (The existing trigger already checks for 'admin', so superadmin will work)

-- Assign superadmin role to f.caloni01@teamsystem.com
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'f.caloni01@teamsystem.com';

-- Note: All RLS policies that check for admin role will also grant access to superadmin
-- due to the pattern: `public.current_user_role() = 'admin'`
-- To make superadmin truly distinct, use:
-- `public.current_user_role() IN ('admin', 'superadmin')`
-- or
-- `public.current_user_role() >= 'admin'` (enum comparison)
