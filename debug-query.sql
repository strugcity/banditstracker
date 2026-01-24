-- Comprehensive Debug Query for Workout Data
-- Run this in Supabase SQL Editor to diagnose the empty workouts issue

-- 1. Check if workouts exist
SELECT
    id,
    name,
    week_number,
    day_of_week,
    created_at
FROM workouts
WHERE name LIKE '%Week 1%'
ORDER BY workout_order;

-- 2. Check workout_exercises for Monday Week 1
SELECT
    we.id as workout_exercise_id,
    we.workout_id,
    we.exercise_card_id,
    we.exercise_order,
    we.superset_group,
    we.prescribed_sets,
    ec.id as card_id,
    ec.name as exercise_name
FROM workout_exercises we
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE we.workout_id IN (
    SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'
)
ORDER BY we.exercise_order;

-- 3. Check if there's a foreign key mismatch
SELECT
    we.id,
    we.exercise_card_id,
    CASE
        WHEN ec.id IS NULL THEN 'MISSING EXERCISE CARD'
        ELSE 'OK'
    END as status
FROM workout_exercises we
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE we.workout_id IN (
    SELECT id FROM workouts WHERE name LIKE '%Week 1%'
);

-- 4. Count exercises per workout
SELECT
    w.name as workout_name,
    COUNT(we.id) as exercise_count,
    COUNT(ec.id) as linked_cards_count,
    CASE
        WHEN COUNT(we.id) != COUNT(ec.id) THEN 'FOREIGN KEY ISSUE'
        ELSE 'OK'
    END as status
FROM workouts w
LEFT JOIN workout_exercises we ON we.workout_id = w.id
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE w.name LIKE '%Week 1%'
GROUP BY w.id, w.name
ORDER BY w.workout_order;

-- 5. Test the exact query that Supabase client would run
SELECT
    we.*,
    jsonb_build_object(
        'id', ec.id,
        'name', ec.name,
        'short_name', ec.short_name,
        'tracks_weight', ec.tracks_weight,
        'tracks_reps', ec.tracks_reps,
        'tracks_duration', ec.tracks_duration
    ) as exercise_card
FROM workout_exercises we
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE we.workout_id IN (
    SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'
)
ORDER BY we.exercise_order;
