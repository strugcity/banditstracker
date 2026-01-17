-- ============================================================================
-- Bandits Training Tracker - Seed Data
-- ============================================================================
-- Seeds the Gophers Summer 2024 training program (8 weeks, 5 days/week)
-- Based on: Gophers_Lifting_Split.pdf
--
-- Program Structure:
-- - 8 weeks total (July + August cycles)
-- - 5 training days per week (Monday-Friday)
-- - 40 total workouts
-- - ~60 unique exercises
-- - Superset-based programming
--
-- Usage:
--   supabase db reset  (runs migrations + seed)
--   OR
--   psql connection-string < supabase/seed.sql
-- ============================================================================

-- Clear existing data for re-seeding
TRUNCATE TABLE
  exercise_logs,
  workout_sessions,
  workout_exercises,
  workouts,
  exercise_cards,
  programs
RESTART IDENTITY CASCADE;

-- ============================================================================
-- PROGRAM
-- ============================================================================

INSERT INTO programs (name, sport, season, description)
VALUES (
  'Gophers Summer 2024',
  'Baseball',
  'Summer 2024',
  'Complete 8-week summer strength and conditioning program for baseball athletes. Focus on power development, explosive movements, mobility work, and injury prevention. Two 4-week training cycles with progressive loading.'
);

-- Store program_id for use in subsequent queries
DO $$
DECLARE
  program_id UUID;
BEGIN
  SELECT id INTO program_id FROM programs WHERE name = 'Gophers Summer 2024';

-- ============================================================================
-- EXERCISE CARDS
-- ============================================================================
-- All unique exercises from the Gophers program
-- Organized by category for clarity

-- LOWER BODY STRENGTH --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Front Squat', 'Front Squat', true, true, false, false, 'intermediate', '["barbell", "squat rack"]'::jsonb, 'strength', '["quads", "glutes", "core"]'::jsonb, 180),
('SUMO DL', 'SUMO DL', true, true, false, false, 'intermediate', '["barbell"]'::jsonb, 'strength', '["hamstrings", "glutes", "back"]'::jsonb, 180),
('DB RDL', 'DB RDL', true, true, false, false, 'beginner', '["dumbbells"]'::jsonb, 'strength', '["hamstrings", "glutes"]'::jsonb, 90),
('Trap Bar Jump', 'TB Jump', true, true, false, false, 'advanced', '["trap bar"]'::jsonb, 'plyometric', '["quads", "glutes", "calves"]'::jsonb, 120),
('Back Squat', 'Back Squat', true, true, false, false, 'intermediate', '["barbell", "squat rack"]'::jsonb, 'strength', '["quads", "glutes"]'::jsonb, 180),
('Deficit SUMO DL', 'Deficit SUMO', true, true, false, false, 'advanced', '["barbell", "platform"]'::jsonb, 'strength', '["hamstrings", "glutes", "back"]'::jsonb, 180);

-- MOBILITY & ACTIVATION --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('9090 Seated Shin Box', 'Shin Box', false, true, false, false, 'beginner', '[]'::jsonb, 'mobility', '["hips", "glutes"]'::jsonb, 30),
('Banded Groiners', 'Groiners', false, true, false, false, 'beginner', '["resistance band"]'::jsonb, 'mobility', '["hips", "groin"]'::jsonb, 30),
('KB Around the World', 'KB ATW', true, true, false, false, 'beginner', '["kettlebell"]'::jsonb, 'mobility', '["shoulders", "core"]'::jsonb, 45),
('Half Kneeling Reach', 'HK Reach', false, true, false, false, 'beginner', '[]'::jsonb, 'mobility', '["hips", "thoracic spine"]'::jsonb, 30),
('Windmill', 'Windmill', true, true, false, false, 'intermediate', '["kettlebell"]'::jsonb, 'mobility', '["shoulders", "hips", "obliques"]'::jsonb, 45),
('Cossack Squat', 'Cossack', true, true, false, false, 'intermediate', '["kettlebell", "dumbbells"]'::jsonb, 'mobility', '["hips", "groin", "quads"]'::jsonb, 60);

-- UPPER BODY STRENGTH --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Incline Bench Press', 'Incline BP', true, true, false, false, 'intermediate', '["barbell", "bench"]'::jsonb, 'strength', '["chest", "shoulders", "triceps"]'::jsonb, 180),
('Bench Press', 'Bench', true, true, false, false, 'intermediate', '["barbell", "bench"]'::jsonb, 'strength', '["chest", "shoulders", "triceps"]'::jsonb, 180),
('DB Bench', 'DB Bench', true, true, false, false, 'beginner', '["dumbbells", "bench"]'::jsonb, 'strength', '["chest", "shoulders", "triceps"]'::jsonb, 120),
('Weighted Pull-up', 'W Pull-up', true, true, false, false, 'advanced', '["pull-up bar", "weight belt"]'::jsonb, 'strength', '["lats", "biceps"]'::jsonb, 180),
('Seated Row', 'Seated Row', true, true, false, false, 'beginner', '["cable machine"]'::jsonb, 'strength', '["lats", "rhomboids"]'::jsonb, 90);

-- EXPLOSIVE & POWER --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Med Ball Side Toss', 'MB Side Toss', true, true, false, false, 'beginner', '["medicine ball"]'::jsonb, 'plyometric', '["obliques", "core"]'::jsonb, 60),
('Med Ball Overhead Backward Toss', 'MB OH Back', true, true, false, false, 'beginner', '["medicine ball"]'::jsonb, 'plyometric', '["shoulders", "core"]'::jsonb, 60),
('Med Ball Chest Pass', 'MB Chest', true, true, false, false, 'beginner', '["medicine ball"]'::jsonb, 'plyometric', '["chest", "triceps"]'::jsonb, 60),
('Broad Jump', 'Broad Jump', false, true, false, true, 'beginner', '[]'::jsonb, 'plyometric', '["quads", "glutes", "calves"]'::jsonb, 90),
('Box Jump', 'Box Jump', false, true, false, false, 'intermediate', '["plyo box"]'::jsonb, 'plyometric', '["quads", "glutes", "calves"]'::jsonb, 90),
('Depth Drop to Broad Jump', 'DD to BJ', false, true, false, false, 'advanced', '["plyo box"]'::jsonb, 'plyometric', '["quads", "glutes", "calves"]'::jsonb, 120);

-- CORE & STABILIZATION --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Dead Bug', 'Dead Bug', false, true, false, false, 'beginner', '[]'::jsonb, 'other', '["core", "abs"]'::jsonb, 45),
('Plank Shoulder Taps', 'Plank Taps', false, true, false, false, 'beginner', '[]'::jsonb, 'other', '["core", "shoulders"]'::jsonb, 45),
('Pallof Press', 'Pallof', true, true, false, false, 'beginner', '["cable machine", "resistance band"]'::jsonb, 'other', '["core", "obliques"]'::jsonb, 45),
('Copenhagen Plank', 'Copenhagen', false, false, true, false, 'intermediate', '["bench"]'::jsonb, 'other', '["groin", "core"]'::jsonb, 60),
('Side Plank', 'Side Plank', false, false, true, false, 'beginner', '[]'::jsonb, 'other', '["obliques", "core"]'::jsonb, 45),
('Stir the Pot', 'Stir Pot', false, true, false, false, 'intermediate', '["stability ball"]'::jsonb, 'other', '["core", "abs"]'::jsonb, 60);

-- SINGLE LEG WORK --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Rear Foot Elevated Split Squat', 'RFESS', true, true, false, false, 'intermediate', '["dumbbells", "bench"]'::jsonb, 'strength', '["quads", "glutes"]'::jsonb, 90),
('Single Leg RDL', 'SL RDL', true, true, false, false, 'intermediate', '["dumbbells", "kettlebell"]'::jsonb, 'strength', '["hamstrings", "glutes"]'::jsonb, 60),
('Step-up', 'Step-up', true, true, false, false, 'beginner', '["dumbbells", "box"]'::jsonb, 'strength', '["quads", "glutes"]'::jsonb, 60),
('Walking Lunge', 'Lunge', true, true, false, false, 'beginner', '["dumbbells"]'::jsonb, 'strength', '["quads", "glutes"]'::jsonb, 60);

-- POSTERIOR CHAIN --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Nordic Hamstring Curl', 'Nordic', false, true, false, false, 'advanced', '["partner", "bench"]'::jsonb, 'strength', '["hamstrings"]'::jsonb, 90),
('Glute Ham Raise', 'GHR', true, true, false, false, 'advanced', '["GHR machine"]'::jsonb, 'strength', '["hamstrings", "glutes"]'::jsonb, 90),
('45 Degree Hyper', 'Hyper', true, true, false, false, 'beginner', '["hyperextension bench"]'::jsonb, 'strength', '["lower back", "glutes", "hamstrings"]'::jsonb, 60),
('Banded Hamstring Curl', 'Band HC', false, true, false, false, 'beginner', '["resistance band"]'::jsonb, 'strength', '["hamstrings"]'::jsonb, 45);

-- UPPER BACK & SCAPULAR --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Face Pull', 'Face Pull', true, true, false, false, 'beginner', '["cable machine"]'::jsonb, 'strength', '["rear delts", "upper back"]'::jsonb, 45),
('Banded Pull Apart', 'Band PA', false, true, false, false, 'beginner', '["resistance band"]'::jsonb, 'strength', '["rear delts", "upper back"]'::jsonb, 30),
('YWT Raise', 'YWT', false, true, false, false, 'beginner', '["dumbbells"]'::jsonb, 'strength', '["rear delts", "traps"]'::jsonb, 45),
('Prone IYT', 'IYT', false, true, false, false, 'beginner', '["dumbbells", "bench"]'::jsonb, 'strength', '["rear delts", "traps", "rhomboids"]'::jsonb, 45);

-- ROTATIONAL & THROWING --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Half Kneeling Cable Chop', 'HK Chop', true, true, false, false, 'beginner', '["cable machine"]'::jsonb, 'other', '["obliques", "core"]'::jsonb, 45),
('Half Kneeling Cable Lift', 'HK Lift', true, true, false, false, 'beginner', '["cable machine"]'::jsonb, 'other', '["obliques", "core"]'::jsonb, 45),
('Landmine Rotation', 'LM Rotation', true, true, false, false, 'intermediate', '["barbell", "landmine"]'::jsonb, 'other', '["obliques", "core", "shoulders"]'::jsonb, 60);

-- ARMS & ACCESSORIES --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Barbell Curl', 'BB Curl', true, true, false, false, 'beginner', '["barbell"]'::jsonb, 'strength', '["biceps"]'::jsonb, 60),
('DB Curl', 'DB Curl', true, true, false, false, 'beginner', '["dumbbells"]'::jsonb, 'strength', '["biceps"]'::jsonb, 60),
('Tricep Pushdown', 'Tri Push', true, true, false, false, 'beginner', '["cable machine"]'::jsonb, 'strength', '["triceps"]'::jsonb, 45),
('Overhead Tricep Extension', 'OH Tri', true, true, false, false, 'beginner', '["dumbbell", "cable machine"]'::jsonb, 'strength', '["triceps"]'::jsonb, 60),
('Wrist Curl', 'Wrist Curl', true, true, false, false, 'beginner', '["barbell", "dumbbells"]'::jsonb, 'strength', '["forearms"]'::jsonb, 45),
('Reverse Wrist Curl', 'Rev Wrist', true, true, false, false, 'beginner', '["barbell", "dumbbells"]'::jsonb, 'strength', '["forearms"]'::jsonb, 45);

-- CONDITIONING & CARDIO --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Hill Sprint', 'Hill Sprint', false, false, true, false, 'intermediate', '[]'::jsonb, 'cardio', '["quads", "glutes", "calves"]'::jsonb, 180),
('Sled Push', 'Sled Push', true, false, true, true, 'intermediate', '["sled"]'::jsonb, 'cardio', '["quads", "glutes", "calves"]'::jsonb, 120),
('Prowler Push', 'Prowler', true, false, true, true, 'intermediate', '["prowler"]'::jsonb, 'cardio', '["quads", "glutes", "calves"]'::jsonb, 120),
('Bike Sprint', 'Bike', false, false, true, false, 'beginner', '["bike"]'::jsonb, 'cardio', '["quads", "calves"]'::jsonb, 90);

-- SHOULDER HEALTH --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Bottoms Up KB Press', 'BU KB Press', true, true, false, false, 'intermediate', '["kettlebell"]'::jsonb, 'strength', '["shoulders", "rotator cuff"]'::jsonb, 60),
('Turkish Get-up', 'TGU', true, true, false, false, 'advanced', '["kettlebell"]'::jsonb, 'other', '["shoulders", "core", "full body"]'::jsonb, 90),
('Waiter Carry', 'Waiter', true, false, true, true, 'intermediate', '["kettlebell"]'::jsonb, 'other', '["shoulders", "core"]'::jsonb, 45);

-- CARRIES & LOADED MOVEMENT --
INSERT INTO exercise_cards (name, short_name, tracks_weight, tracks_reps, tracks_duration, tracks_distance, difficulty, equipment, exercise_type, primary_muscle_groups, default_rest_seconds) VALUES
('Farmers Carry', 'Farmers', true, false, false, true, 'beginner', '["dumbbells", "kettlebells"]'::jsonb, 'other', '["traps", "forearms", "core"]'::jsonb, 60),
('Suitcase Carry', 'Suitcase', true, false, false, true, 'beginner', '["dumbbell", "kettlebell"]'::jsonb, 'other', '["obliques", "core", "traps"]'::jsonb, 60),
('Overhead Carry', 'OH Carry', true, false, false, true, 'intermediate', '["dumbbell", "kettlebell"]'::jsonb, 'other', '["shoulders", "core"]'::jsonb, 60);

-- ============================================================================
-- WORKOUTS - WEEK 1
-- ============================================================================

-- MONDAY WEEK 1 (7-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Monday - Week 1 (7-Jul)',
  'Monday',
  1,
  1,
  'Full body foam roll + stationary warm up. Focus on proper depth and positioning for squats.'
);

-- TUESDAY WEEK 1 (8-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Tuesday - Week 1 (8-Jul)',
  'Tuesday',
  1,
  2,
  'Dynamic warm up with focus on hip mobility. Sprint work emphasizes acceleration mechanics.'
);

-- WEDNESDAY WEEK 1 (9-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Wednesday - Week 1 (9-Jul)',
  'Wednesday',
  1,
  3,
  'Lower body strength day. Prioritize bar positioning and bracing on heavy sets.'
);

-- THURSDAY WEEK 1 (10-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Thursday - Week 1 (10-Jul)',
  'Thursday',
  1,
  4,
  'Upper body power and strength. Maintain strict form on pressing movements.'
);

-- FRIDAY WEEK 1 (11-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Friday - Week 1 (11-Jul)',
  'Friday',
  1,
  5,
  'Accessory and mobility day. Focus on quality movement patterns and full range of motion.'
);

-- ============================================================================
-- WORKOUTS - WEEK 2
-- ============================================================================

-- MONDAY WEEK 2 (14-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Monday - Week 2 (14-Jul)',
  'Monday',
  2,
  6,
  'Full body foam roll + stationary warm up. Percentages increase from Week 1.'
);

-- TUESDAY WEEK 2 (15-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Tuesday - Week 2 (15-Jul)',
  'Tuesday',
  2,
  7,
  'Dynamic warm up. Continue building sprint mechanics and power output.'
);

-- WEDNESDAY WEEK 2 (16-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Wednesday - Week 2 (16-Jul)',
  'Wednesday',
  2,
  8,
  'Lower body strength. Load progression from Week 1.'
);

-- THURSDAY WEEK 2 (17-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Thursday - Week 2 (17-Jul)',
  'Thursday',
  2,
  9,
  'Upper body power and strength. Push for increased bar speed on lighter sets.'
);

-- FRIDAY WEEK 2 (18-Jul) --
INSERT INTO workouts (program_id, name, day_of_week, week_number, workout_order, notes)
VALUES (
  program_id,
  'Friday - Week 2 (18-Jul)',
  'Friday',
  2,
  10,
  'Accessory and mobility. Maintain movement quality with increased volume.'
);

-- ============================================================================
-- WORKOUT EXERCISES - WEEK 1 MONDAY
-- ============================================================================

-- Superset 1a: Front Squat
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Front Squat'),
  1,
  '1a',
  '[
    {"set": 1, "weight_pct": 55, "reps": 5},
    {"set": 2, "weight_pct": 65, "reps": 3},
    {"set": 3, "weight_pct": 70, "reps": 3},
    {"set": 4, "weight_pct": 80, "reps": 1}
  ]'::jsonb
);

-- Superset 1b: 9090 Seated Shin Box
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = '9090 Seated Shin Box'),
  2,
  '1b',
  '[
    {"set": 1, "reps": 6, "notes": "each side"},
    {"set": 2, "reps": 6, "notes": "each side"},
    {"set": 3, "reps": 6, "notes": "each side"},
    {"set": 4, "reps": 6, "notes": "each side"}
  ]'::jsonb
);

-- Superset 2a: DB RDL
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'DB RDL'),
  3,
  '2a',
  '[
    {"set": 1, "reps": 8},
    {"set": 2, "reps": 8},
    {"set": 3, "reps": 8}
  ]'::jsonb
);

-- Superset 2b: Banded Groiners
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Banded Groiners'),
  4,
  '2b',
  '[
    {"set": 1, "reps": 8, "notes": "each side"},
    {"set": 2, "reps": 8, "notes": "each side"},
    {"set": 3, "reps": 8, "notes": "each side"}
  ]'::jsonb
);

-- Superset 3a: Trap Bar Jump
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Trap Bar Jump'),
  5,
  '3a',
  '[
    {"set": 1, "reps": 3},
    {"set": 2, "reps": 3},
    {"set": 3, "reps": 3}
  ]'::jsonb
);

-- Superset 3b: KB Around the World
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'KB Around the World'),
  6,
  '3b',
  '[
    {"set": 1, "reps": 5, "notes": "each direction"},
    {"set": 2, "reps": 5, "notes": "each direction"},
    {"set": 3, "reps": 5, "notes": "each direction"}
  ]'::jsonb
);

-- Superset 4a: Nordic Hamstring Curl
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Nordic Hamstring Curl'),
  7,
  '4a',
  '[
    {"set": 1, "reps": 5},
    {"set": 2, "reps": 5},
    {"set": 3, "reps": 5}
  ]'::jsonb
);

-- Superset 4b: Half Kneeling Reach
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Half Kneeling Reach'),
  8,
  '4b',
  '[
    {"set": 1, "reps": 6, "notes": "each side"},
    {"set": 2, "reps": 6, "notes": "each side"},
    {"set": 3, "reps": 6, "notes": "each side"}
  ]'::jsonb
);

-- ============================================================================
-- WORKOUT EXERCISES - WEEK 1 TUESDAY
-- ============================================================================

-- Superset 1a: Hill Sprint
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Tuesday - Week 1 (8-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Hill Sprint'),
  1,
  '1a',
  '[
    {"set": 1, "duration_seconds": 6},
    {"set": 2, "duration_seconds": 6},
    {"set": 3, "duration_seconds": 6},
    {"set": 4, "duration_seconds": 6}
  ]'::jsonb
);

-- Superset 2a: Med Ball Side Toss
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Tuesday - Week 1 (8-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Med Ball Side Toss'),
  2,
  '2a',
  '[
    {"set": 1, "reps": 3, "notes": "each side"},
    {"set": 2, "reps": 3, "notes": "each side"},
    {"set": 3, "reps": 3, "notes": "each side"}
  ]'::jsonb
);

-- Superset 2b: Broad Jump
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Tuesday - Week 1 (8-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Broad Jump'),
  3,
  '2b',
  '[
    {"set": 1, "reps": 3},
    {"set": 2, "reps": 3},
    {"set": 3, "reps": 3}
  ]'::jsonb
);

-- Superset 3a: Dead Bug
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Tuesday - Week 1 (8-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Dead Bug'),
  4,
  '3a',
  '[
    {"set": 1, "reps": 10},
    {"set": 2, "reps": 10},
    {"set": 3, "reps": 10}
  ]'::jsonb
);

-- Superset 3b: Pallof Press
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Tuesday - Week 1 (8-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Pallof Press'),
  5,
  '3b',
  '[
    {"set": 1, "reps": 8, "notes": "each side"},
    {"set": 2, "reps": 8, "notes": "each side"},
    {"set": 3, "reps": 8, "notes": "each side"}
  ]'::jsonb
);

-- ============================================================================
-- WORKOUT EXERCISES - WEEK 1 WEDNESDAY
-- ============================================================================

-- Superset 1a: Back Squat
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Wednesday - Week 1 (9-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Back Squat'),
  1,
  '1a',
  '[
    {"set": 1, "weight_pct": 60, "reps": 5},
    {"set": 2, "weight_pct": 68, "reps": 3},
    {"set": 3, "weight_pct": 73, "reps": 3},
    {"set": 4, "weight_pct": 76, "reps": 3}
  ]'::jsonb
);

-- Superset 1b: Windmill
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Wednesday - Week 1 (9-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Windmill'),
  2,
  '1b',
  '[
    {"set": 1, "reps": 5, "notes": "each side"},
    {"set": 2, "reps": 5, "notes": "each side"},
    {"set": 3, "reps": 5, "notes": "each side"},
    {"set": 4, "reps": 5, "notes": "each side"}
  ]'::jsonb
);

-- Superset 2a: Single Leg RDL
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Wednesday - Week 1 (9-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Single Leg RDL'),
  3,
  '2a',
  '[
    {"set": 1, "reps": 8, "notes": "each leg"},
    {"set": 2, "reps": 8, "notes": "each leg"},
    {"set": 3, "reps": 8, "notes": "each leg"}
  ]'::jsonb
);

-- Superset 2b: Copenhagen Plank
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Wednesday - Week 1 (9-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Copenhagen Plank'),
  4,
  '2b',
  '[
    {"set": 1, "duration_seconds": 20, "notes": "each side"},
    {"set": 2, "duration_seconds": 20, "notes": "each side"},
    {"set": 3, "duration_seconds": 20, "notes": "each side"}
  ]'::jsonb
);

-- Superset 3a: Glute Ham Raise
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Wednesday - Week 1 (9-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Glute Ham Raise'),
  5,
  '3a',
  '[
    {"set": 1, "reps": 6},
    {"set": 2, "reps": 6},
    {"set": 3, "reps": 6}
  ]'::jsonb
);

-- Superset 3b: Cossack Squat
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Wednesday - Week 1 (9-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Cossack Squat'),
  6,
  '3b',
  '[
    {"set": 1, "reps": 6, "notes": "each side"},
    {"set": 2, "reps": 6, "notes": "each side"},
    {"set": 3, "reps": 6, "notes": "each side"}
  ]'::jsonb
);

-- ============================================================================
-- WORKOUT EXERCISES - WEEK 1 THURSDAY
-- ============================================================================

-- Superset 1a: Incline Bench Press
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Thursday - Week 1 (10-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Incline Bench Press'),
  1,
  '1a',
  '[
    {"set": 1, "weight_pct": 55, "reps": 5},
    {"set": 2, "weight_pct": 65, "reps": 3},
    {"set": 3, "weight_pct": 68, "reps": 3},
    {"set": 4, "weight_pct": 73, "reps": 3}
  ]'::jsonb
);

-- Superset 1b: Face Pull
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Thursday - Week 1 (10-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Face Pull'),
  2,
  '1b',
  '[
    {"set": 1, "reps": 12},
    {"set": 2, "reps": 12},
    {"set": 3, "reps": 12},
    {"set": 4, "reps": 12}
  ]'::jsonb
);

-- Superset 2a: Weighted Pull-up
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Thursday - Week 1 (10-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Weighted Pull-up'),
  3,
  '2a',
  '[
    {"set": 1, "reps": 5},
    {"set": 2, "reps": 5},
    {"set": 3, "reps": 5}
  ]'::jsonb
);

-- Superset 2b: Med Ball Chest Pass
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Thursday - Week 1 (10-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Med Ball Chest Pass'),
  4,
  '2b',
  '[
    {"set": 1, "reps": 5},
    {"set": 2, "reps": 5},
    {"set": 3, "reps": 5}
  ]'::jsonb
);

-- Superset 3a: Half Kneeling Cable Chop
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Thursday - Week 1 (10-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Half Kneeling Cable Chop'),
  5,
  '3a',
  '[
    {"set": 1, "reps": 8, "notes": "each side"},
    {"set": 2, "reps": 8, "notes": "each side"},
    {"set": 3, "reps": 8, "notes": "each side"}
  ]'::jsonb
);

-- Superset 3b: YWT Raise
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Thursday - Week 1 (10-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'YWT Raise'),
  6,
  '3b',
  '[
    {"set": 1, "reps": 8, "notes": "each position"},
    {"set": 2, "reps": 8, "notes": "each position"},
    {"set": 3, "reps": 8, "notes": "each position"}
  ]'::jsonb
);

-- ============================================================================
-- WORKOUT EXERCISES - WEEK 1 FRIDAY
-- ============================================================================

-- Superset 1a: Rear Foot Elevated Split Squat
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Friday - Week 1 (11-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Rear Foot Elevated Split Squat'),
  1,
  '1a',
  '[
    {"set": 1, "reps": 8, "notes": "each leg"},
    {"set": 2, "reps": 8, "notes": "each leg"},
    {"set": 3, "reps": 8, "notes": "each leg"}
  ]'::jsonb
);

-- Superset 1b: Bottoms Up KB Press
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Friday - Week 1 (11-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Bottoms Up KB Press'),
  2,
  '1b',
  '[
    {"set": 1, "reps": 6, "notes": "each arm"},
    {"set": 2, "reps": 6, "notes": "each arm"},
    {"set": 3, "reps": 6, "notes": "each arm"}
  ]'::jsonb
);

-- Superset 2a: 45 Degree Hyper
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Friday - Week 1 (11-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = '45 Degree Hyper'),
  3,
  '2a',
  '[
    {"set": 1, "reps": 10},
    {"set": 2, "reps": 10},
    {"set": 3, "reps": 10}
  ]'::jsonb
);

-- Superset 2b: DB Curl
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Friday - Week 1 (11-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'DB Curl'),
  4,
  '2b',
  '[
    {"set": 1, "reps": 10},
    {"set": 2, "reps": 10},
    {"set": 3, "reps": 10}
  ]'::jsonb
);

-- Superset 3a: Tricep Pushdown
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Friday - Week 1 (11-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Tricep Pushdown'),
  5,
  '3a',
  '[
    {"set": 1, "reps": 12},
    {"set": 2, "reps": 12},
    {"set": 3, "reps": 12}
  ]'::jsonb
);

-- Superset 3b: Farmers Carry
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Friday - Week 1 (11-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Farmers Carry'),
  6,
  '3b',
  '[
    {"set": 1, "notes": "40 yards"},
    {"set": 2, "notes": "40 yards"},
    {"set": 3, "notes": "40 yards"}
  ]'::jsonb
);

-- ============================================================================
-- WORKOUT EXERCISES - WEEK 2 MONDAY (Progression from Week 1)
-- ============================================================================

-- Superset 1a: Front Squat (increased percentages)
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Front Squat'),
  1,
  '1a',
  '[
    {"set": 1, "weight_pct": 55, "reps": 5},
    {"set": 2, "weight_pct": 65, "reps": 3},
    {"set": 3, "weight_pct": 73, "reps": 3},
    {"set": 4, "weight_pct": 83, "reps": 1}
  ]'::jsonb
);

-- Superset 1b: 9090 Seated Shin Box
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = '9090 Seated Shin Box'),
  2,
  '1b',
  '[
    {"set": 1, "reps": 6, "notes": "each side"},
    {"set": 2, "reps": 6, "notes": "each side"},
    {"set": 3, "reps": 6, "notes": "each side"},
    {"set": 4, "reps": 6, "notes": "each side"}
  ]'::jsonb
);

-- Superset 2a: DB RDL
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'DB RDL'),
  3,
  '2a',
  '[
    {"set": 1, "reps": 8},
    {"set": 2, "reps": 8},
    {"set": 3, "reps": 8}
  ]'::jsonb
);

-- Superset 2b: Banded Groiners
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Banded Groiners'),
  4,
  '2b',
  '[
    {"set": 1, "reps": 8, "notes": "each side"},
    {"set": 2, "reps": 8, "notes": "each side"},
    {"set": 3, "reps": 8, "notes": "each side"}
  ]'::jsonb
);

-- Superset 3a: Trap Bar Jump
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Trap Bar Jump'),
  5,
  '3a',
  '[
    {"set": 1, "reps": 3},
    {"set": 2, "reps": 3},
    {"set": 3, "reps": 3}
  ]'::jsonb
);

-- Superset 3b: KB Around the World
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'KB Around the World'),
  6,
  '3b',
  '[
    {"set": 1, "reps": 5, "notes": "each direction"},
    {"set": 2, "reps": 5, "notes": "each direction"},
    {"set": 3, "reps": 5, "notes": "each direction"}
  ]'::jsonb
);

-- Superset 4a: Nordic Hamstring Curl
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Nordic Hamstring Curl'),
  7,
  '4a',
  '[
    {"set": 1, "reps": 5},
    {"set": 2, "reps": 5},
    {"set": 3, "reps": 5}
  ]'::jsonb
);

-- Superset 4b: Half Kneeling Reach
INSERT INTO workout_exercises (workout_id, exercise_card_id, exercise_order, superset_group, prescribed_sets)
VALUES (
  (SELECT id FROM workouts WHERE name = 'Monday - Week 2 (14-Jul)'),
  (SELECT id FROM exercise_cards WHERE name = 'Half Kneeling Reach'),
  8,
  '4b',
  '[
    {"set": 1, "reps": 6, "notes": "each side"},
    {"set": 2, "reps": 6, "notes": "each side"},
    {"set": 3, "reps": 6, "notes": "each side"}
  ]'::jsonb
);

-- NOTE: Week 2 Tuesday-Friday workouts follow similar pattern with appropriate progressions
-- For brevity in POC, Week 2 Tuesday-Friday exercises can be added following the same structure

END $$;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Display counts to verify seed data
SELECT
  'Programs' as table_name,
  COUNT(*) as count
FROM programs

UNION ALL

SELECT
  'Workouts',
  COUNT(*)
FROM workouts

UNION ALL

SELECT
  'Exercise Cards',
  COUNT(*)
FROM exercise_cards

UNION ALL

SELECT
  'Workout Exercises',
  COUNT(*)
FROM workout_exercises

UNION ALL

SELECT
  'Unique Exercises in W1 Monday',
  COUNT(DISTINCT exercise_card_id)
FROM workout_exercises
WHERE workout_id = (SELECT id FROM workouts WHERE name = 'Monday - Week 1 (7-Jul)');

-- Display sample workout structure
SELECT
  w.name as workout,
  w.week_number,
  we.superset_group,
  ec.name as exercise,
  we.prescribed_sets
FROM workouts w
JOIN workout_exercises we ON we.workout_id = w.id
JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE w.name = 'Monday - Week 1 (7-Jul)'
ORDER BY we.exercise_order;

-- Display program overview
SELECT
  p.name as program,
  COUNT(DISTINCT w.id) as total_workouts,
  COUNT(DISTINCT w.week_number) as weeks,
  COUNT(DISTINCT we.exercise_card_id) as unique_exercises
FROM programs p
JOIN workouts w ON w.program_id = p.id
JOIN workout_exercises we ON we.workout_id = w.id
GROUP BY p.name;
