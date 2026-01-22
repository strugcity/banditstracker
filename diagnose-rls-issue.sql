-- ============================================================================
-- DIAGNOSTIC QUERY: Test RLS Policies for workout_exercises JOIN
-- Run this in Supabase SQL Editor AFTER signing in to your app
-- ============================================================================

-- 1. Check if you can see exercise_cards
SELECT
    'exercise_cards' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN is_global = TRUE THEN 1 END) as global_rows,
    COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as owned_rows
FROM exercise_cards;

-- 2. Check if you can see workout_exercises
SELECT
    'workout_exercises' as table_name,
    COUNT(*) as total_rows
FROM workout_exercises;

-- 3. Try the exact JOIN that's failing
SELECT
    we.id,
    we.workout_id,
    we.exercise_card_id,
    ec.id as card_id,
    ec.name as card_name,
    ec.is_global,
    ec.owner_id
FROM workout_exercises we
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE we.workout_id = '3b0c33f3-b14d-4b1c-92e6-2adb01d6300f'
ORDER BY we.exercise_order
LIMIT 5;

-- 4. Check current user's auth status
SELECT
    auth.uid() as current_user_id,
    auth.role() as current_role,
    (SELECT is_global_admin FROM profiles WHERE id = auth.uid()) as is_global_admin;

-- 5. Check if any exercise_cards are orphaned (no is_global flag)
SELECT
    id,
    name,
    is_global,
    owner_id,
    team_id,
    CASE
        WHEN is_global IS NULL THEN 'NULL - WILL FAIL RLS'
        WHEN is_global = FALSE AND owner_id IS NULL AND team_id IS NULL THEN 'ORPHANED - WILL FAIL RLS'
        ELSE 'OK'
    END as rls_status
FROM exercise_cards
WHERE is_global IS NULL
   OR (is_global = FALSE AND owner_id IS NULL AND team_id IS NULL)
LIMIT 10;
