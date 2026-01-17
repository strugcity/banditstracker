-- ============================================================================
-- QA VERIFICATION SCRIPT
-- ============================================================================
-- This script verifies that the schema was created correctly
-- Run this in Supabase SQL Editor to validate the database
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify all tables exist
-- ============================================================================
SELECT 'TEST 1: Checking if all tables exist...' as test;

SELECT
    table_name,
    CASE
        WHEN table_name IN ('programs', 'workouts', 'exercise_cards', 'workout_exercises', 'workout_sessions', 'exercise_logs')
        THEN '✓ EXISTS'
        ELSE '✗ UNEXPECTED'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- TEST 2: Verify column counts for each table
-- ============================================================================
SELECT 'TEST 2: Verifying table structures...' as test;

SELECT
    table_name,
    COUNT(*) as column_count,
    CASE table_name
        WHEN 'programs' THEN CASE WHEN COUNT(*) = 7 THEN '✓ CORRECT' ELSE '✗ WRONG COUNT' END
        WHEN 'workouts' THEN CASE WHEN COUNT(*) = 8 THEN '✓ CORRECT' ELSE '✗ WRONG COUNT' END
        WHEN 'exercise_cards' THEN CASE WHEN COUNT(*) = 20 THEN '✓ CORRECT' ELSE '✗ WRONG COUNT' END
        WHEN 'workout_exercises' THEN CASE WHEN COUNT(*) = 7 THEN '✓ CORRECT' ELSE '✗ WRONG COUNT' END
        WHEN 'workout_sessions' THEN CASE WHEN COUNT(*) = 8 THEN '✓ CORRECT' ELSE '✗ WRONG COUNT' END
        WHEN 'exercise_logs' THEN CASE WHEN COUNT(*) = 11 THEN '✓ CORRECT' ELSE '✗ WRONG COUNT' END
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('programs', 'workouts', 'exercise_cards', 'workout_exercises', 'workout_sessions', 'exercise_logs')
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- TEST 3: Verify foreign key constraints
-- ============================================================================
SELECT 'TEST 3: Checking foreign key constraints...' as test;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✓ EXISTS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- TEST 4: Verify indexes exist
-- ============================================================================
SELECT 'TEST 4: Checking performance indexes...' as test;

SELECT
    tablename,
    indexname,
    '✓ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- TEST 5: Verify triggers exist
-- ============================================================================
SELECT 'TEST 5: Checking triggers...' as test;

SELECT
    event_object_table AS table_name,
    trigger_name,
    '✓ EXISTS' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- ============================================================================
-- TEST 6: Verify trigger function exists
-- ============================================================================
SELECT 'TEST 6: Checking trigger function...' as test;

SELECT
    routine_name,
    routine_type,
    '✓ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'update_updated_at_column';

-- ============================================================================
-- TEST 7: Insert sample data to verify relationships
-- ============================================================================
SELECT 'TEST 7: Testing data insertion and relationships...' as test;

-- Insert a test program
INSERT INTO programs (name, sport, season, description)
VALUES ('QA Test Program', 'Baseball', 'Summer 2024', 'Test program for QA')
RETURNING id, name, created_at, '✓ INSERTED' as status;

-- Store the program_id for next inserts
DO $$
DECLARE
    test_program_id UUID;
    test_workout_id UUID;
    test_exercise_id UUID;
    test_workout_exercise_id UUID;
    test_session_id UUID;
BEGIN
    -- Get the test program ID
    SELECT id INTO test_program_id FROM programs WHERE name = 'QA Test Program';

    -- Insert a test workout
    INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order)
    VALUES (test_program_id, 'Monday - Week 1', 'Monday', 1, 1)
    RETURNING id INTO test_workout_id;

    -- Insert a test exercise card
    INSERT INTO exercise_cards (
        name,
        short_name,
        instructions,
        coaching_cues,
        equipment,
        exercise_type,
        primary_muscle_groups,
        tracks_weight,
        tracks_reps
    ) VALUES (
        'QA Test Squat',
        'Squat',
        '["Stand with feet shoulder-width apart", "Lower your body by bending knees", "Return to starting position"]'::jsonb,
        '["Keep chest up", "Knees track over toes"]'::jsonb,
        '["Barbell", "Squat Rack"]'::jsonb,
        'strength',
        '["Quadriceps", "Glutes", "Hamstrings"]'::jsonb,
        true,
        true
    ) RETURNING id INTO test_exercise_id;

    -- Insert workout exercise (junction)
    INSERT INTO workout_exercises (
        workout_id,
        exercise_card_id,
        exercise_order,
        superset_group,
        prescribed_sets
    ) VALUES (
        test_workout_id,
        test_exercise_id,
        1,
        '1a',
        '[{"set": 1, "weight_pct": 60, "reps": 5}, {"set": 2, "weight_pct": 70, "reps": 3}]'::jsonb
    ) RETURNING id INTO test_workout_exercise_id;

    -- Insert a workout session
    INSERT INTO workout_sessions (
        workout_id,
        started_at,
        status
    ) VALUES (
        test_workout_id,
        NOW(),
        'in_progress'
    ) RETURNING id INTO test_session_id;

    -- Insert exercise logs
    INSERT INTO exercise_logs (
        workout_session_id,
        workout_exercise_id,
        set_number,
        weight,
        reps,
        rpe,
        completed
    ) VALUES
        (test_session_id, test_workout_exercise_id, 1, 135.00, 5, 7, true),
        (test_session_id, test_workout_exercise_id, 2, 155.00, 3, 8, true);

    RAISE NOTICE '✓ All test data inserted successfully';
END $$;

-- ============================================================================
-- TEST 8: Verify JSONB data was stored correctly
-- ============================================================================
SELECT 'TEST 8: Verifying JSONB fields...' as test;

SELECT
    name,
    instructions->0 as first_instruction,
    coaching_cues->0 as first_cue,
    equipment,
    primary_muscle_groups,
    '✓ JSONB WORKING' as status
FROM exercise_cards
WHERE name = 'QA Test Squat';

SELECT
    prescribed_sets
FROM workout_exercises
WHERE exercise_order = 1
LIMIT 1;

-- ============================================================================
-- TEST 9: Verify CASCADE deletes work
-- ============================================================================
SELECT 'TEST 9: Testing CASCADE delete...' as test;

-- Count records before delete
SELECT
    (SELECT COUNT(*) FROM programs WHERE name = 'QA Test Program') as programs_count,
    (SELECT COUNT(*) FROM workouts WHERE name = 'Monday - Week 1') as workouts_count,
    (SELECT COUNT(*) FROM workout_exercises) as workout_exercises_count,
    (SELECT COUNT(*) FROM workout_sessions) as sessions_count,
    (SELECT COUNT(*) FROM exercise_logs) as logs_count,
    'BEFORE DELETE' as timing;

-- Delete the test program (should cascade to all related records)
DELETE FROM programs WHERE name = 'QA Test Program';

-- Count records after delete (should all be 0 for related records)
SELECT
    (SELECT COUNT(*) FROM programs WHERE name = 'QA Test Program') as programs_count,
    (SELECT COUNT(*) FROM workouts WHERE name = 'Monday - Week 1') as workouts_count,
    (SELECT COUNT(*) FROM workout_exercises WHERE notes IS NULL) as workout_exercises_count,
    (SELECT COUNT(*) FROM workout_sessions WHERE athlete_id IS NULL) as sessions_count,
    (SELECT COUNT(*) FROM exercise_logs WHERE notes IS NULL) as logs_count,
    CASE
        WHEN (SELECT COUNT(*) FROM workouts WHERE name = 'Monday - Week 1') = 0
        THEN '✓ CASCADE WORKING'
        ELSE '✗ CASCADE FAILED'
    END as status;

-- Clean up test exercise card
DELETE FROM exercise_cards WHERE name = 'QA Test Squat';

-- ============================================================================
-- TEST 10: Verify updated_at trigger works
-- ============================================================================
SELECT 'TEST 10: Testing updated_at trigger...' as test;

-- Insert test program
INSERT INTO programs (name, sport)
VALUES ('Trigger Test', 'Football')
RETURNING id, created_at, updated_at, 'INITIAL VALUES' as timing;

-- Wait a moment and update it
DO $$
DECLARE
    test_id UUID;
    initial_updated_at TIMESTAMPTZ;
    new_updated_at TIMESTAMPTZ;
BEGIN
    SELECT id INTO test_id FROM programs WHERE name = 'Trigger Test';
    SELECT updated_at INTO initial_updated_at FROM programs WHERE id = test_id;

    -- Small delay
    PERFORM pg_sleep(1);

    -- Update the record
    UPDATE programs SET sport = 'Basketball' WHERE id = test_id;

    -- Check if updated_at changed
    SELECT updated_at INTO new_updated_at FROM programs WHERE id = test_id;

    IF new_updated_at > initial_updated_at THEN
        RAISE NOTICE '✓ Trigger working: updated_at changed from % to %', initial_updated_at, new_updated_at;
    ELSE
        RAISE NOTICE '✗ Trigger failed: updated_at did not change';
    END IF;
END $$;

-- Clean up
DELETE FROM programs WHERE name = 'Trigger Test';

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
SELECT 'QA VERIFICATION COMPLETE!' as summary;

SELECT
    'All tests completed. Review results above.' as message,
    'If all tests show ✓, the schema is ready for development!' as next_steps;
