-- ============================================================================
-- Migration: 009_enforce_athlete_id_not_null.sql
-- Description: Enforce NOT NULL constraint on workout_sessions.athlete_id
-- ============================================================================
--
-- SECURITY FIX: Prevents orphaned workout sessions with null athlete_id.
-- In a multi-tenant system, all workout sessions must be attributed to a user.
--
-- This migration:
-- 1. Identifies any existing sessions with null athlete_id (should be none due to RLS)
-- 2. Adds NOT NULL constraint to prevent future null values
-- 3. Adds a comment documenting the security requirement
--
-- BEFORE RUNNING: Verify no orphaned records exist
-- SELECT COUNT(*) FROM workout_sessions WHERE athlete_id IS NULL;
-- (Should return 0 due to RLS policies)

-- Step 1: Clean up any orphaned records (if any exist)
-- Note: This should return 0 rows affected due to RLS policies, but we handle it anyway
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned sessions
    SELECT COUNT(*) INTO orphaned_count
    FROM workout_sessions
    WHERE athlete_id IS NULL;

    -- Log the result
    RAISE NOTICE 'Found % orphaned workout sessions with null athlete_id', orphaned_count;

    -- Delete orphaned sessions (if any)
    -- In production, you might want to move these to an archive table instead
    DELETE FROM workout_sessions WHERE athlete_id IS NULL;

    RAISE NOTICE 'Deleted % orphaned workout sessions', orphaned_count;
END $$;

-- Step 2: Add NOT NULL constraint
-- This will prevent any future sessions from being created without an athlete_id
ALTER TABLE workout_sessions
    ALTER COLUMN athlete_id SET NOT NULL;

-- Step 3: Add table comment documenting the requirement
COMMENT ON COLUMN workout_sessions.athlete_id IS
    'Required: User ID of the athlete performing this workout. Must not be null. RLS policies enforce that users can only create/view their own sessions (or sessions of athletes they coach).';

-- Verify the constraint was added
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) > 0 INTO constraint_exists
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_sessions'
      AND column_name = 'athlete_id'
      AND is_nullable = 'NO';

    IF constraint_exists THEN
        RAISE NOTICE 'SUCCESS: athlete_id NOT NULL constraint is now enforced';
    ELSE
        RAISE EXCEPTION 'FAILED: athlete_id NOT NULL constraint was not applied';
    END IF;
END $$;
