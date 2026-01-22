-- Disable Row Level Security (RLS) for testing
-- Run this in Supabase SQL Editor to allow anonymous access to all tables

-- This is for development/testing only!
-- In production, you should have proper RLS policies in place

ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'programs',
        'workouts',
        'workout_exercises',
        'exercise_cards',
        'workout_sessions',
        'exercise_logs'
    );
