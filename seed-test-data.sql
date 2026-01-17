-- Seed Test Data for Bandits Training Tracker
-- Run this in your Supabase SQL Editor to populate test data

-- Step 1: Insert a test program and capture its ID
INSERT INTO programs (name, sport, season, description)
VALUES (
  'Gophers Summer 2024',
  'Baseball',
  'Summer 2024',
  'Summer strength and conditioning program for Gophers baseball team'
)
RETURNING id;

-- Note: Copy the UUID returned above and replace 'YOUR_PROGRAM_ID_HERE' below

-- Step 2: Insert workouts for Week 1
-- Replace 'YOUR_PROGRAM_ID_HERE' with the actual UUID from step 1
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES
  ('YOUR_PROGRAM_ID_HERE', 'Upper Body Strength', 'Monday', 1, 1, 'Focus on compound movements'),
  ('YOUR_PROGRAM_ID_HERE', 'Lower Body Power', 'Tuesday', 1, 2, 'Explosive movements and plyometrics'),
  ('YOUR_PROGRAM_ID_HERE', 'Conditioning', 'Wednesday', 1, 3, 'Speed and agility work'),
  ('YOUR_PROGRAM_ID_HERE', 'Full Body', 'Thursday', 1, 4, 'Total body strength'),
  ('YOUR_PROGRAM_ID_HERE', 'Active Recovery', 'Friday', 1, 5, 'Light mobility and stretching'),
  ('YOUR_PROGRAM_ID_HERE', 'Sprint Training', 'Saturday', 1, 6, 'Sprint mechanics and speed work');

-- Step 3: Insert workouts for Week 2
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES
  ('YOUR_PROGRAM_ID_HERE', 'Push Day', 'Monday', 2, 7, 'Chest, shoulders, triceps'),
  ('YOUR_PROGRAM_ID_HERE', 'Pull Day', 'Tuesday', 2, 8, 'Back, biceps, rear delts'),
  ('YOUR_PROGRAM_ID_HERE', 'Leg Day', 'Wednesday', 2, 9, 'Squats, deadlifts, accessory work'),
  ('YOUR_PROGRAM_ID_HERE', 'Upper Power', 'Thursday', 2, 10, 'Explosive upper body'),
  ('YOUR_PROGRAM_ID_HERE', 'Mobility', 'Friday', 2, 11, 'Stretching and recovery'),
  ('YOUR_PROGRAM_ID_HERE', 'Cardio', 'Saturday', 2, 12, 'Endurance training');

-- Verification Query
SELECT
  p.name as program_name,
  COUNT(w.id) as workout_count,
  MIN(w.week_number) as first_week,
  MAX(w.week_number) as last_week
FROM programs p
LEFT JOIN workouts w ON w.program_id = p.id
GROUP BY p.id, p.name;
