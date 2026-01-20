-- ============================================================================
-- Migration: 005_add_auth_system_fixed.sql
-- Description: Add multi-user authentication, teams, and role-based access
-- This replaces 004 and handles existing profiles table
-- ============================================================================

-- Enable UUID extension (required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: HANDLE EXISTING PROFILES TABLE
-- ============================================================================

-- Drop existing profiles table if it exists (it's likely the default Supabase one)
DROP TABLE IF EXISTS profiles CASCADE;

-- User profiles (linked to Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_global_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- SECTION 2: NEW TABLES
-- ============================================================================

-- Teams/Organizations
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport VARCHAR(100),
    invite_code VARCHAR(20) UNIQUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON teams(invite_code);

-- Team membership with roles
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES profiles(id),
    UNIQUE(team_id, user_id)
);

-- Create indexes for team member lookups
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============================================================================
-- SECTION 3: ALTER EXISTING TABLES
-- ============================================================================

-- Programs: Add ownership and visibility
ALTER TABLE programs
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
    ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

-- Add check constraint for visibility (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'programs_visibility_check'
    ) THEN
        ALTER TABLE programs ADD CONSTRAINT programs_visibility_check
            CHECK (visibility IN ('private', 'team', 'public'));
    END IF;
END $$;

-- Create indexes for program lookups
CREATE INDEX IF NOT EXISTS idx_programs_owner_id ON programs(owner_id);
CREATE INDEX IF NOT EXISTS idx_programs_team_id ON programs(team_id);

-- Exercise cards: Add ownership for hybrid model
ALTER TABLE exercise_cards
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
    ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

-- Create indexes for exercise card lookups
CREATE INDEX IF NOT EXISTS idx_exercise_cards_owner_id ON exercise_cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_exercise_cards_team_id ON exercise_cards(team_id);
CREATE INDEX IF NOT EXISTS idx_exercise_cards_is_global ON exercise_cards(is_global);

-- Mark all existing exercises as global (migration of existing data)
UPDATE exercise_cards SET is_global = TRUE WHERE is_global IS NULL OR is_global = FALSE;

-- Mark all existing programs as public (migration of existing data)
UPDATE programs SET visibility = 'public' WHERE visibility IS NULL;

-- ============================================================================
-- SECTION 4: HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if current user is a global admin
CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT is_global_admin FROM profiles WHERE id = auth.uid()),
        FALSE
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is an admin of a specific team
CREATE OR REPLACE FUNCTION is_team_admin(team_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = auth.uid()
        AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is a member of a specific team
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_uuid
        AND user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get all team IDs where current user is an admin
CREATE OR REPLACE FUNCTION get_user_admin_team_ids()
RETURNS SETOF UUID AS $$
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid() AND role = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get all team IDs where current user is a member
CREATE OR REPLACE FUNCTION get_user_team_ids()
RETURNS SETOF UUID AS $$
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: RLS POLICIES - PROFILES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid());

-- Global admins can view all profiles
CREATE POLICY "profiles_select_global_admin" ON profiles
    FOR SELECT USING (is_global_admin());

-- Team admins can view profiles of their team members
CREATE POLICY "profiles_select_team_admin" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm_admin
            WHERE tm_admin.user_id = auth.uid()
            AND tm_admin.role = 'admin'
            AND EXISTS (
                SELECT 1 FROM team_members tm_member
                WHERE tm_member.team_id = tm_admin.team_id
                AND tm_member.user_id = profiles.id
            )
        )
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Global admins can update any profile
CREATE POLICY "profiles_update_global_admin" ON profiles
    FOR UPDATE USING (is_global_admin());

-- Profiles are created via trigger, but allow insert for service role
CREATE POLICY "profiles_insert_service" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- SECTION 7: RLS POLICIES - TEAMS
-- ============================================================================

-- Team members can view their teams
CREATE POLICY "teams_select_member" ON teams
    FOR SELECT USING (is_team_member(id));

-- Global admins can view all teams
CREATE POLICY "teams_select_global_admin" ON teams
    FOR SELECT USING (is_global_admin());

-- Authenticated users can create teams
CREATE POLICY "teams_insert_authenticated" ON teams
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Team admins can update their teams
CREATE POLICY "teams_update_team_admin" ON teams
    FOR UPDATE USING (is_team_admin(id));

-- Global admins can update any team
CREATE POLICY "teams_update_global_admin" ON teams
    FOR UPDATE USING (is_global_admin());

-- Team admins can delete their teams
CREATE POLICY "teams_delete_team_admin" ON teams
    FOR DELETE USING (is_team_admin(id));

-- Global admins can delete any team
CREATE POLICY "teams_delete_global_admin" ON teams
    FOR DELETE USING (is_global_admin());

-- ============================================================================
-- SECTION 8: RLS POLICIES - TEAM MEMBERS
-- ============================================================================

-- Team members can view their team's members
CREATE POLICY "team_members_select_member" ON team_members
    FOR SELECT USING (
        team_id IN (SELECT get_user_team_ids())
    );

-- Global admins can view all team members
CREATE POLICY "team_members_select_global_admin" ON team_members
    FOR SELECT USING (is_global_admin());

-- Users can add themselves to a team (via invite code)
CREATE POLICY "team_members_insert_self" ON team_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Team admins can add members to their teams
CREATE POLICY "team_members_insert_team_admin" ON team_members
    FOR INSERT WITH CHECK (is_team_admin(team_id));

-- Global admins can add members to any team
CREATE POLICY "team_members_insert_global_admin" ON team_members
    FOR INSERT WITH CHECK (is_global_admin());

-- Team admins can update members in their teams
CREATE POLICY "team_members_update_team_admin" ON team_members
    FOR UPDATE USING (is_team_admin(team_id));

-- Global admins can update any team member
CREATE POLICY "team_members_update_global_admin" ON team_members
    FOR UPDATE USING (is_global_admin());

-- Users can remove themselves from a team
CREATE POLICY "team_members_delete_self" ON team_members
    FOR DELETE USING (user_id = auth.uid());

-- Team admins can remove members from their teams
CREATE POLICY "team_members_delete_team_admin" ON team_members
    FOR DELETE USING (is_team_admin(team_id));

-- Global admins can remove any team member
CREATE POLICY "team_members_delete_global_admin" ON team_members
    FOR DELETE USING (is_global_admin());

-- ============================================================================
-- SECTION 9: RLS POLICIES - PROGRAMS
-- ============================================================================

-- Public programs are visible to all authenticated users
CREATE POLICY "programs_select_public" ON programs
    FOR SELECT USING (visibility = 'public' AND auth.uid() IS NOT NULL);

-- Users can view their own programs
CREATE POLICY "programs_select_own" ON programs
    FOR SELECT USING (owner_id = auth.uid());

-- Team members can view team programs
CREATE POLICY "programs_select_team" ON programs
    FOR SELECT USING (
        visibility = 'team' AND team_id IN (SELECT get_user_team_ids())
    );

-- Global admins can view all programs
CREATE POLICY "programs_select_global_admin" ON programs
    FOR SELECT USING (is_global_admin());

-- Authenticated users can create programs
CREATE POLICY "programs_insert_authenticated" ON programs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own programs
CREATE POLICY "programs_update_own" ON programs
    FOR UPDATE USING (owner_id = auth.uid());

-- Team admins can update team programs
CREATE POLICY "programs_update_team_admin" ON programs
    FOR UPDATE USING (
        team_id IS NOT NULL AND is_team_admin(team_id)
    );

-- Global admins can update any program
CREATE POLICY "programs_update_global_admin" ON programs
    FOR UPDATE USING (is_global_admin());

-- Users can delete their own programs
CREATE POLICY "programs_delete_own" ON programs
    FOR DELETE USING (owner_id = auth.uid());

-- Team admins can delete team programs
CREATE POLICY "programs_delete_team_admin" ON programs
    FOR DELETE USING (
        team_id IS NOT NULL AND is_team_admin(team_id)
    );

-- Global admins can delete any program
CREATE POLICY "programs_delete_global_admin" ON programs
    FOR DELETE USING (is_global_admin());

-- ============================================================================
-- SECTION 10: RLS POLICIES - WORKOUTS
-- ============================================================================

-- Users can view workouts from programs they can access
CREATE POLICY "workouts_select_via_program" ON workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = workouts.program_id
            AND (
                p.visibility = 'public'
                OR p.owner_id = auth.uid()
                OR (p.visibility = 'team' AND p.team_id IN (SELECT get_user_team_ids()))
                OR is_global_admin()
            )
        )
    );

-- Users can insert workouts into programs they own or admin
CREATE POLICY "workouts_insert_program_owner" ON workouts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = workouts.program_id
            AND (
                p.owner_id = auth.uid()
                OR (p.team_id IS NOT NULL AND is_team_admin(p.team_id))
                OR is_global_admin()
            )
        )
    );

-- Users can update workouts in programs they own or admin
CREATE POLICY "workouts_update_program_owner" ON workouts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = workouts.program_id
            AND (
                p.owner_id = auth.uid()
                OR (p.team_id IS NOT NULL AND is_team_admin(p.team_id))
                OR is_global_admin()
            )
        )
    );

-- Users can delete workouts in programs they own or admin
CREATE POLICY "workouts_delete_program_owner" ON workouts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM programs p
            WHERE p.id = workouts.program_id
            AND (
                p.owner_id = auth.uid()
                OR (p.team_id IS NOT NULL AND is_team_admin(p.team_id))
                OR is_global_admin()
            )
        )
    );

-- ============================================================================
-- SECTION 11: RLS POLICIES - WORKOUT EXERCISES
-- ============================================================================

-- Users can view workout exercises from workouts they can access
CREATE POLICY "workout_exercises_select_via_workout" ON workout_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workouts w
            JOIN programs p ON p.id = w.program_id
            WHERE w.id = workout_exercises.workout_id
            AND (
                p.visibility = 'public'
                OR p.owner_id = auth.uid()
                OR (p.visibility = 'team' AND p.team_id IN (SELECT get_user_team_ids()))
                OR is_global_admin()
            )
        )
    );

-- Users can insert workout exercises into workouts they can manage
CREATE POLICY "workout_exercises_insert_workout_owner" ON workout_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts w
            JOIN programs p ON p.id = w.program_id
            WHERE w.id = workout_exercises.workout_id
            AND (
                p.owner_id = auth.uid()
                OR (p.team_id IS NOT NULL AND is_team_admin(p.team_id))
                OR is_global_admin()
            )
        )
    );

-- Users can update workout exercises in workouts they can manage
CREATE POLICY "workout_exercises_update_workout_owner" ON workout_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workouts w
            JOIN programs p ON p.id = w.program_id
            WHERE w.id = workout_exercises.workout_id
            AND (
                p.owner_id = auth.uid()
                OR (p.team_id IS NOT NULL AND is_team_admin(p.team_id))
                OR is_global_admin()
            )
        )
    );

-- Users can delete workout exercises in workouts they can manage
CREATE POLICY "workout_exercises_delete_workout_owner" ON workout_exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workouts w
            JOIN programs p ON p.id = w.program_id
            WHERE w.id = workout_exercises.workout_id
            AND (
                p.owner_id = auth.uid()
                OR (p.team_id IS NOT NULL AND is_team_admin(p.team_id))
                OR is_global_admin()
            )
        )
    );

-- ============================================================================
-- SECTION 12: RLS POLICIES - EXERCISE CARDS (Hybrid Model)
-- ============================================================================

-- Global exercises are visible to all authenticated users
CREATE POLICY "exercise_cards_select_global" ON exercise_cards
    FOR SELECT USING (is_global = TRUE AND auth.uid() IS NOT NULL);

-- Users can view their own exercises
CREATE POLICY "exercise_cards_select_own" ON exercise_cards
    FOR SELECT USING (owner_id = auth.uid());

-- Team members can view team exercises
CREATE POLICY "exercise_cards_select_team" ON exercise_cards
    FOR SELECT USING (team_id IN (SELECT get_user_team_ids()));

-- Global admins can view all exercises
CREATE POLICY "exercise_cards_select_global_admin" ON exercise_cards
    FOR SELECT USING (is_global_admin());

-- Authenticated users can create exercises
CREATE POLICY "exercise_cards_insert_authenticated" ON exercise_cards
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own exercises
CREATE POLICY "exercise_cards_update_own" ON exercise_cards
    FOR UPDATE USING (owner_id = auth.uid());

-- Team admins can update team exercises
CREATE POLICY "exercise_cards_update_team_admin" ON exercise_cards
    FOR UPDATE USING (
        team_id IS NOT NULL AND is_team_admin(team_id)
    );

-- Global admins can update any exercise (including global ones)
CREATE POLICY "exercise_cards_update_global_admin" ON exercise_cards
    FOR UPDATE USING (is_global_admin());

-- Users can delete their own exercises
CREATE POLICY "exercise_cards_delete_own" ON exercise_cards
    FOR DELETE USING (owner_id = auth.uid());

-- Team admins can delete team exercises
CREATE POLICY "exercise_cards_delete_team_admin" ON exercise_cards
    FOR DELETE USING (
        team_id IS NOT NULL AND is_team_admin(team_id)
    );

-- Global admins can delete any exercise
CREATE POLICY "exercise_cards_delete_global_admin" ON exercise_cards
    FOR DELETE USING (is_global_admin());

-- ============================================================================
-- SECTION 13: RLS POLICIES - WORKOUT SESSIONS
-- ============================================================================

-- Users can view their own workout sessions
CREATE POLICY "workout_sessions_select_own" ON workout_sessions
    FOR SELECT USING (athlete_id = auth.uid());

-- Team admins can view sessions of their team members
CREATE POLICY "workout_sessions_select_team_admin" ON workout_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm_admin
            WHERE tm_admin.user_id = auth.uid()
            AND tm_admin.role = 'admin'
            AND EXISTS (
                SELECT 1 FROM team_members tm_athlete
                WHERE tm_athlete.team_id = tm_admin.team_id
                AND tm_athlete.user_id = workout_sessions.athlete_id
            )
        )
    );

-- Global admins can view all workout sessions
CREATE POLICY "workout_sessions_select_global_admin" ON workout_sessions
    FOR SELECT USING (is_global_admin());

-- Users can create their own workout sessions
CREATE POLICY "workout_sessions_insert_own" ON workout_sessions
    FOR INSERT WITH CHECK (athlete_id = auth.uid());

-- Users can update their own workout sessions
CREATE POLICY "workout_sessions_update_own" ON workout_sessions
    FOR UPDATE USING (athlete_id = auth.uid());

-- Global admins can update any workout session
CREATE POLICY "workout_sessions_update_global_admin" ON workout_sessions
    FOR UPDATE USING (is_global_admin());

-- Users can delete their own workout sessions
CREATE POLICY "workout_sessions_delete_own" ON workout_sessions
    FOR DELETE USING (athlete_id = auth.uid());

-- Global admins can delete any workout session
CREATE POLICY "workout_sessions_delete_global_admin" ON workout_sessions
    FOR DELETE USING (is_global_admin());

-- ============================================================================
-- SECTION 14: RLS POLICIES - EXERCISE LOGS
-- ============================================================================

-- Users can view logs from their own sessions
CREATE POLICY "exercise_logs_select_own" ON exercise_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_sessions ws
            WHERE ws.id = exercise_logs.workout_session_id
            AND ws.athlete_id = auth.uid()
        )
    );

-- Team admins can view logs of their team members
CREATE POLICY "exercise_logs_select_team_admin" ON exercise_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_sessions ws
            JOIN team_members tm_admin ON tm_admin.user_id = auth.uid() AND tm_admin.role = 'admin'
            JOIN team_members tm_athlete ON tm_athlete.team_id = tm_admin.team_id AND tm_athlete.user_id = ws.athlete_id
            WHERE ws.id = exercise_logs.workout_session_id
        )
    );

-- Global admins can view all exercise logs
CREATE POLICY "exercise_logs_select_global_admin" ON exercise_logs
    FOR SELECT USING (is_global_admin());

-- Users can insert logs into their own sessions
CREATE POLICY "exercise_logs_insert_own" ON exercise_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_sessions ws
            WHERE ws.id = exercise_logs.workout_session_id
            AND ws.athlete_id = auth.uid()
        )
    );

-- Users can update logs in their own sessions
CREATE POLICY "exercise_logs_update_own" ON exercise_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workout_sessions ws
            WHERE ws.id = exercise_logs.workout_session_id
            AND ws.athlete_id = auth.uid()
        )
    );

-- Global admins can update any exercise log
CREATE POLICY "exercise_logs_update_global_admin" ON exercise_logs
    FOR UPDATE USING (is_global_admin());

-- Users can delete logs from their own sessions
CREATE POLICY "exercise_logs_delete_own" ON exercise_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workout_sessions ws
            WHERE ws.id = exercise_logs.workout_session_id
            AND ws.athlete_id = auth.uid()
        )
    );

-- Global admins can delete any exercise log
CREATE POLICY "exercise_logs_delete_global_admin" ON exercise_logs
    FOR DELETE USING (is_global_admin());

-- ============================================================================
-- SECTION 15: TRIGGER FOR AUTO-CREATING PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, is_global_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 16: TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS teams_updated_at ON teams;
CREATE TRIGGER teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 17: HELPER FUNCTION FOR GENERATING INVITE CODES
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 18: FUNCTION TO CREATE TEAM WITH ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION create_team_with_admin(
    team_name TEXT,
    team_description TEXT DEFAULT NULL,
    team_sport TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_team_id UUID;
    new_invite_code TEXT;
BEGIN
    -- Generate unique invite code
    LOOP
        new_invite_code := generate_invite_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM teams WHERE invite_code = new_invite_code);
    END LOOP;

    -- Create the team
    INSERT INTO teams (name, description, sport, invite_code, created_by)
    VALUES (team_name, team_description, team_sport, new_invite_code, auth.uid())
    RETURNING id INTO new_team_id;

    -- Add creator as admin
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (new_team_id, auth.uid(), 'admin');

    RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 19: FUNCTION TO JOIN TEAM BY INVITE CODE
-- ============================================================================

CREATE OR REPLACE FUNCTION join_team_by_invite_code(code TEXT)
RETURNS UUID AS $$
DECLARE
    found_team_id UUID;
BEGIN
    -- Find team by invite code
    SELECT id INTO found_team_id
    FROM teams
    WHERE invite_code = UPPER(code);

    IF found_team_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;

    -- Check if already a member
    IF EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = found_team_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Already a member of this team';
    END IF;

    -- Add as user (not admin)
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (found_team_id, auth.uid(), 'user');

    RETURN found_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 20: FUNCTION TO REGENERATE INVITE CODE
-- ============================================================================

CREATE OR REPLACE FUNCTION regenerate_team_invite_code(team_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    new_invite_code TEXT;
BEGIN
    -- Check if user is team admin or global admin
    IF NOT is_team_admin(team_uuid) AND NOT is_global_admin() THEN
        RAISE EXCEPTION 'Not authorized to regenerate invite code';
    END IF;

    -- Generate unique invite code
    LOOP
        new_invite_code := generate_invite_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM teams WHERE invite_code = new_invite_code);
    END LOOP;

    -- Update team
    UPDATE teams
    SET invite_code = new_invite_code
    WHERE id = team_uuid;

    RETURN new_invite_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
