-- Seed Test Data for Bandits Training Tracker
-- Run this entire script in your Supabase SQL Editor
-- This uses a transaction to ensure all data is inserted correctly

DO $$
DECLARE
  program_id UUID;
BEGIN
  -- Step 1: Insert the program and store its ID
  INSERT INTO programs (name, sport, season, description)
  VALUES (
    'Gophers Summer 2024',
    'Baseball',
    'Summer 2024',
    'Summer strength and conditioning program for Gophers baseball team'
  )
  RETURNING id INTO program_id;

  -- Step 2: Insert Week 1 workouts
  INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
  VALUES
    (program_id, 'Upper Body Strength', 'Monday', 1, 1, 'Focus on compound movements'),
    (program_id, 'Lower Body Power', 'Tuesday', 1, 2, 'Explosive movements and plyometrics'),
    (program_id, 'Conditioning', 'Wednesday', 1, 3, 'Speed and agility work'),
    (program_id, 'Full Body', 'Thursday', 1, 4, 'Total body strength'),
    (program_id, 'Active Recovery', 'Friday', 1, 5, 'Light mobility and stretching'),
    (program_id, 'Sprint Training', 'Saturday', 1, 6, 'Sprint mechanics and speed work');

  -- Step 3: Insert Week 2 workouts
  INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
  VALUES
    (program_id, 'Push Day', 'Monday', 2, 7, 'Chest, shoulders, triceps'),
    (program_id, 'Pull Day', 'Tuesday', 2, 8, 'Back, biceps, rear delts'),
    (program_id, 'Leg Day', 'Wednesday', 2, 9, 'Squats, deadlifts, accessory work'),
    (program_id, 'Upper Power', 'Thursday', 2, 10, 'Explosive upper body'),
    (program_id, 'Mobility', 'Friday', 2, 11, 'Stretching and recovery'),
    (program_id, 'Cardio', 'Saturday', 2, 12, 'Endurance training');

  -- Step 4: Insert Week 3 workouts
  INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
  VALUES
    (program_id, 'Strength Focus', 'Monday', 3, 13, 'Heavy compound lifts'),
    (program_id, 'Speed Work', 'Tuesday', 3, 14, 'Acceleration drills'),
    (program_id, 'Full Body Conditioning', 'Wednesday', 3, 15, 'Circuit training'),
    (program_id, 'Upper Hypertrophy', 'Thursday', 3, 16, 'Volume work for muscle growth'),
    (program_id, 'Recovery Day', 'Friday', 3, 17, 'Yoga and stretching'),
    (program_id, 'Team Practice', 'Saturday', 3, 18, 'Baseball-specific drills');

  -- Print success message
  RAISE NOTICE 'Successfully created program with ID: %', program_id;
  RAISE NOTICE 'Inserted 18 workouts across 3 weeks';

END $$;

-- Verification: View all programs and their workouts
SELECT
  p.name as program_name,
  p.sport,
  p.season,
  COUNT(w.id) as total_workouts,
  COUNT(DISTINCT w.week_number) as total_weeks
FROM programs p
LEFT JOIN workouts w ON w.program_id = p.id
WHERE p.name = 'Gophers Summer 2024'
GROUP BY p.id, p.name, p.sport, p.season;

-- View workouts by week
SELECT
  w.week_number,
  w.day_of_week,
  w.name as workout_name,
  w.workout_order
FROM workouts w
JOIN programs p ON p.id = w.program_id
WHERE p.name = 'Gophers Summer 2024'
ORDER BY w.workout_order;
