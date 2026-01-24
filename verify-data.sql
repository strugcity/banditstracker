-- Verify that workout_exercises exist and are properly linked
-- Run this in Supabase SQL Editor

-- 1. Check if workout_exercises exist for Week 1 workouts
SELECT
    w.name as workout_name,
    COUNT(we.id) as exercise_count,
    COUNT(ec.id) as linked_cards_count,
    ARRAY_AGG(ec.name ORDER BY we.exercise_order) as exercise_names
FROM workouts w
LEFT JOIN workout_exercises we ON we.workout_id = w.id
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE w.name LIKE '%Week 1%'
GROUP BY w.id, w.name, w.workout_order
ORDER BY w.workout_order;

-- 2. Check specific workout_exercises for Monday Week 1
SELECT
    we.id,
    we.workout_id,
    we.exercise_card_id,
    we.exercise_order,
    we.superset_group,
    jsonb_pretty(we.prescribed_sets) as prescribed_sets,
    ec.name as exercise_name,
    ec.short_name
FROM workout_exercises we
JOIN workouts w ON w.id = we.workout_id
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE w.name = 'Monday - Week 1 (7-Jul)'
ORDER BY we.exercise_order;

-- 3. Check if exercise_cards table has data
SELECT COUNT(*) as total_exercise_cards FROM exercise_cards;

-- 4. Check if there are any workout_exercises at all
SELECT COUNT(*) as total_workout_exercises FROM workout_exercises;
