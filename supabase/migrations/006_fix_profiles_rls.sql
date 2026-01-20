-- ============================================================================
-- Migration: 006_fix_profiles_rls.sql
-- Description: Fix circular dependency in profiles RLS policies
-- ============================================================================

-- The issue: profiles_select_global_admin policy calls is_global_admin()
-- which queries the profiles table, causing infinite recursion.
--
-- Solution: For profiles table, check is_global_admin directly in the policy
-- instead of using the function.

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_select_global_admin" ON profiles;

-- Recreate with direct check (no function call to avoid recursion)
CREATE POLICY "profiles_select_global_admin" ON profiles
    FOR SELECT USING (
        (SELECT is_global_admin FROM profiles WHERE id = auth.uid()) = TRUE
    );

-- Also fix the update policy for global admins
DROP POLICY IF EXISTS "profiles_update_global_admin" ON profiles;

CREATE POLICY "profiles_update_global_admin" ON profiles
    FOR UPDATE USING (
        (SELECT is_global_admin FROM profiles WHERE id = auth.uid()) = TRUE
    );
