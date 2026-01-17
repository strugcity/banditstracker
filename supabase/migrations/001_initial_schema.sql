-- ============================================================================
-- Bandits Training Tracker - Initial Database Schema
-- ============================================================================
-- This migration creates the core database schema for a mobile workout
-- tracking application. It supports programs, workouts, exercises, and
-- detailed logging of training sessions.
--
-- KEY FEATURES:
-- - Video service integration ready (YouTube, coaching cues, screenshots)
-- - Flexible exercise tracking (weight, reps, duration, distance, RPE)
-- - Superset support via superset_group
-- - Single-user POC design with multi-user ready architecture
-- ============================================================================

-- Enable UUID extension for auto-generated IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TRIGGER FUNCTION: Update updated_at timestamp
-- ============================================================================
-- Automatically updates the updated_at column when a row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: programs
-- ============================================================================
-- Training programs represent a collection of workouts (e.g., "Gophers Summer 2024")
-- Programs can be sport-specific and season-specific
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(100),
    season VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE programs IS 'Training programs that contain multiple workouts';
COMMENT ON COLUMN programs.name IS 'Program name (e.g., "Gophers Summer 2024")';
COMMENT ON COLUMN programs.sport IS 'Sport type (e.g., "Baseball", "Basketball")';
COMMENT ON COLUMN programs.season IS 'Season identifier (e.g., "Summer 2024")';

-- ============================================================================
-- TABLE: workouts
-- ============================================================================
-- Individual workout sessions within a program (e.g., "Monday - Week 1")
-- Contains the workout template that will be logged by athletes
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    day_of_week VARCHAR(20),
    week_number INTEGER,
    workout_order INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workouts IS 'Workout templates within a program';
COMMENT ON COLUMN workouts.program_id IS 'Reference to parent program';
COMMENT ON COLUMN workouts.day_of_week IS 'Day of week (e.g., "Monday")';
COMMENT ON COLUMN workouts.week_number IS 'Week number in program (1-8)';
COMMENT ON COLUMN workouts.workout_order IS 'Sort order for displaying workouts';
COMMENT ON COLUMN workouts.notes IS 'Workout notes (warm-up instructions, etc.)';

-- ============================================================================
-- TABLE: exercise_cards
-- ============================================================================
-- Master exercise library with video service integration
-- This table is designed to be compatible with video platforms (YouTube, etc.)
-- and can store coaching cues, instructions, and video metadata
CREATE TABLE IF NOT EXISTS exercise_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    short_name VARCHAR(100),

    -- Video Service Integration Fields
    instructions JSONB,
    coaching_cues JSONB,
    screenshot_timestamps JSONB,
    video_url TEXT,
    video_start_time VARCHAR(10),
    video_end_time VARCHAR(10),

    -- Exercise Metadata
    difficulty VARCHAR(20),
    equipment JSONB,
    exercise_type VARCHAR(50),
    primary_muscle_groups JSONB,

    -- Tracking Configuration
    tracks_weight BOOLEAN DEFAULT TRUE,
    tracks_reps BOOLEAN DEFAULT TRUE,
    tracks_duration BOOLEAN DEFAULT FALSE,
    tracks_distance BOOLEAN DEFAULT FALSE,
    default_rest_seconds INTEGER DEFAULT 90,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE exercise_cards IS 'Master exercise library with video service integration';
COMMENT ON COLUMN exercise_cards.name IS 'Full exercise name (e.g., "Front Squat")';
COMMENT ON COLUMN exercise_cards.short_name IS 'Abbreviated name for mobile display';
COMMENT ON COLUMN exercise_cards.instructions IS 'Array of step-by-step instructions as JSONB';
COMMENT ON COLUMN exercise_cards.coaching_cues IS 'Array of coaching tips and cues as JSONB';
COMMENT ON COLUMN exercise_cards.screenshot_timestamps IS 'Array of timestamp strings for video screenshots';
COMMENT ON COLUMN exercise_cards.video_url IS 'YouTube or direct video link URL';
COMMENT ON COLUMN exercise_cards.video_start_time IS 'Start time in video (e.g., "01:30")';
COMMENT ON COLUMN exercise_cards.video_end_time IS 'End time in video (e.g., "02:15")';
COMMENT ON COLUMN exercise_cards.difficulty IS 'Difficulty level: "beginner", "intermediate", "advanced"';
COMMENT ON COLUMN exercise_cards.equipment IS 'Array of equipment needed as JSONB';
COMMENT ON COLUMN exercise_cards.exercise_type IS 'Type: "strength", "cardio", "mobility", etc.';
COMMENT ON COLUMN exercise_cards.primary_muscle_groups IS 'Array of target muscle groups as JSONB';
COMMENT ON COLUMN exercise_cards.tracks_weight IS 'Whether this exercise tracks weight';
COMMENT ON COLUMN exercise_cards.tracks_reps IS 'Whether this exercise tracks reps';
COMMENT ON COLUMN exercise_cards.tracks_duration IS 'Whether this exercise tracks duration';
COMMENT ON COLUMN exercise_cards.tracks_distance IS 'Whether this exercise tracks distance';
COMMENT ON COLUMN exercise_cards.default_rest_seconds IS 'Default rest time between sets';

-- ============================================================================
-- TABLE: workout_exercises
-- ============================================================================
-- Junction table linking exercises to workouts with prescription details
-- Stores the exercise order, superset grouping, and prescribed sets
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_card_id UUID NOT NULL REFERENCES exercise_cards(id) ON DELETE CASCADE,
    exercise_order INTEGER NOT NULL,
    superset_group VARCHAR(10),
    prescribed_sets JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workout_exercises IS 'Junction table linking exercises to workouts with prescriptions';
COMMENT ON COLUMN workout_exercises.exercise_order IS 'Position in workout (1, 2, 3...)';
COMMENT ON COLUMN workout_exercises.superset_group IS 'Superset identifier (e.g., "1a", "1b", "2a")';
COMMENT ON COLUMN workout_exercises.prescribed_sets IS 'Array of set prescriptions: [{"set": 1, "weight_pct": 55, "reps": 5}]';
COMMENT ON COLUMN workout_exercises.notes IS 'Exercise-specific notes for this workout';

-- ============================================================================
-- TABLE: workout_sessions
-- ============================================================================
-- Logged workout sessions by athletes
-- Tracks when a workout was started, completed, and its status
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    athlete_id UUID,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workout_sessions IS 'Actual logged workout sessions by athletes';
COMMENT ON COLUMN workout_sessions.athlete_id IS 'NULL for POC, will be user_id in multi-user v2';
COMMENT ON COLUMN workout_sessions.started_at IS 'Timestamp when workout was started';
COMMENT ON COLUMN workout_sessions.completed_at IS 'Timestamp when workout was completed';
COMMENT ON COLUMN workout_sessions.status IS 'Session status: "in_progress", "completed", "skipped"';

-- ============================================================================
-- TABLE: exercise_logs
-- ============================================================================
-- Individual set logs for each exercise in a workout session
-- Tracks weight, reps, duration, distance, RPE, and completion status
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight DECIMAL(6,2),
    reps INTEGER,
    duration_seconds INTEGER,
    distance DECIMAL(6,2),
    rpe INTEGER,
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE exercise_logs IS 'Individual set logs with weight, reps, RPE, etc.';
COMMENT ON COLUMN exercise_logs.set_number IS 'Set number (1, 2, 3...)';
COMMENT ON COLUMN exercise_logs.weight IS 'Weight used (e.g., 185.50 lbs)';
COMMENT ON COLUMN exercise_logs.reps IS 'Number of repetitions completed';
COMMENT ON COLUMN exercise_logs.duration_seconds IS 'Duration in seconds (for timed exercises)';
COMMENT ON COLUMN exercise_logs.distance IS 'Distance (e.g., 100.00 meters)';
COMMENT ON COLUMN exercise_logs.rpe IS 'Rate of Perceived Exertion (1-10 scale)';
COMMENT ON COLUMN exercise_logs.completed IS 'Whether the set was completed';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Improve query performance for common lookup patterns

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id
    ON workout_exercises(workout_id);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_card_id
    ON workout_exercises(exercise_card_id);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id
    ON workout_sessions(workout_id);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_athlete_id
    ON workout_sessions(athlete_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_session_id
    ON exercise_logs(workout_session_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_exercise_id
    ON exercise_logs(workout_exercise_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_cards_updated_at
    BEFORE UPDATE ON exercise_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- This schema supports:
-- ✓ Video service integration (YouTube, coaching cues, timestamps)
-- ✓ Flexible exercise tracking (weight/reps/duration/distance/RPE)
-- ✓ Superset support
-- ✓ Single-user POC with multi-user ready design
-- ✓ Proper foreign key constraints with CASCADE deletes
-- ✓ Performance indexes on common queries
-- ✓ Automatic timestamp management
-- ============================================================================
