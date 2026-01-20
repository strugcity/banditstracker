-- ============================================================================
-- Migration: 007_fix_rls_recursion.sql
-- Description: Fix RLS infinite recursion on profiles table
-- ============================================================================

-- The problem: RLS policies on profiles table that check is_global_admin
-- cause infinite recursion because checking is_global_admin requires
-- reading the profiles table.
--
-- Solution:
-- 1. Drop all SELECT policies on profiles that cause recursion
-- 2. Create simpler policies that don't recurse
-- 3. Use a SECURITY DEFINER function that bypasses RLS for the admin check

-- First, create a helper function that bypasses RLS to check admin status
-- This function runs as the definer (superuser) so it's not subject to RLS
CREATE OR REPLACE FUNCTION check_is_global_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT is_global_admin INTO is_admin
    FROM profiles
    WHERE id = user_uuid;

    RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop all existing SELECT policies on profiles to start fresh
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_global_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_team_admin" ON profiles;

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_global_admin" ON profiles;

-- Create new non-recursive SELECT policies

-- Policy 1: Users can always read their own profile (no recursion possible)
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid());

-- Policy 2: Global admins can read all profiles
-- Uses the SECURITY DEFINER function to avoid recursion
CREATE POLICY "profiles_select_global_admin" ON profiles
    FOR SELECT USING (check_is_global_admin(auth.uid()));

-- Policy 3: Team admins can view profiles of their team members
-- This is safe because it doesn't query profiles table in the policy
CREATE POLICY "profiles_select_team_admin" ON profiles
    FOR SELECT USING (
        id IN (
            SELECT tm_member.user_id
            FROM team_members tm_admin
            JOIN team_members tm_member ON tm_member.team_id = tm_admin.team_id
            WHERE tm_admin.user_id = auth.uid()
            AND tm_admin.role = 'admin'
        )
    );

-- Create new non-recursive UPDATE policies

-- Policy 1: Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Policy 2: Global admins can update any profile
CREATE POLICY "profiles_update_global_admin" ON profiles
    FOR UPDATE USING (check_is_global_admin(auth.uid()));

-- Also update the is_global_admin() function to use the new helper
CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_is_global_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
