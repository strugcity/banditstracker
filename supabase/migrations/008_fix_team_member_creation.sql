-- ============================================================================
-- Migration: 008_fix_team_member_creation.sql
-- Description: Fix team member creation and add utility functions
-- ============================================================================

-- Update create_team_with_admin to be more robust
-- This version ensures the profile exists before creating team member
CREATE OR REPLACE FUNCTION create_team_with_admin(
    team_name TEXT,
    team_description TEXT DEFAULT NULL,
    team_sport TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_team_id UUID;
    new_invite_code TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Ensure user has a profile (create one if missing)
    INSERT INTO profiles (id, email, full_name, is_global_admin)
    SELECT
        current_user_id,
        COALESCE((SELECT email FROM auth.users WHERE id = current_user_id), 'unknown'),
        '',
        FALSE
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id);

    -- Generate unique invite code
    LOOP
        new_invite_code := generate_invite_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM teams WHERE invite_code = new_invite_code);
    END LOOP;

    -- Create the team
    INSERT INTO teams (name, description, sport, invite_code, created_by)
    VALUES (team_name, team_description, team_sport, new_invite_code, current_user_id)
    RETURNING id INTO new_team_id;

    -- Add creator as admin
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (new_team_id, current_user_id, 'admin');

    RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add existing user as team admin (for fixing existing teams)
CREATE OR REPLACE FUNCTION add_team_creator_as_admin(team_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    team_creator UUID;
BEGIN
    -- Check if user is global admin
    IF NOT check_is_global_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized - must be global admin';
    END IF;

    -- Get the team creator
    SELECT created_by INTO team_creator
    FROM teams
    WHERE id = team_uuid;

    IF team_creator IS NULL THEN
        RAISE EXCEPTION 'Team not found or has no creator';
    END IF;

    -- Check if creator is already a member
    IF EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid AND user_id = team_creator
    ) THEN
        -- Already a member, just ensure they're an admin
        UPDATE team_members
        SET role = 'admin'
        WHERE team_id = team_uuid AND user_id = team_creator;
        RETURN TRUE;
    END IF;

    -- Add creator as admin
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (team_uuid, team_creator, 'admin');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only allow if called by the user themselves or a global admin
    IF auth.uid() != user_uuid AND NOT check_is_global_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Try to create profile if missing
    INSERT INTO profiles (id, email, full_name, is_global_admin)
    SELECT
        user_uuid,
        COALESCE((SELECT email FROM auth.users WHERE id = user_uuid), 'unknown'),
        COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid), ''),
        FALSE
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix existing teams that may not have their creator as a member
-- This runs once when the migration is applied
DO $$
DECLARE
    team_record RECORD;
BEGIN
    FOR team_record IN
        SELECT t.id, t.created_by
        FROM teams t
        WHERE t.created_by IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = t.id AND tm.user_id = t.created_by
        )
    LOOP
        -- Add creator as admin for each team missing their creator
        INSERT INTO team_members (team_id, user_id, role)
        VALUES (team_record.id, team_record.created_by, 'admin')
        ON CONFLICT (team_id, user_id) DO NOTHING;
    END LOOP;
END $$;
