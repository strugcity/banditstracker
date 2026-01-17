# Database Schema Documentation

## Overview

Supabase (PostgreSQL) database schema for Bandits Training Tracker.

## Tables

### `profiles`
User profile information (extends Supabase auth.users)

```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### `exercises`
Exercise definitions and metadata

```sql
exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'push', 'pull', 'legs', 'core'
  equipment TEXT[], -- array of required equipment
  video_url TEXT, -- link to instructional video
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### `workouts`
Workout session records

```sql
workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_seconds INTEGER, -- calculated field
  total_volume NUMERIC, -- sum of all sets (weight * reps)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### `workout_exercises`
Junction table for exercises performed in a workout

```sql
workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL, -- order in workout
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### `sets`
Individual sets performed during a workout

```sql
sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC, -- in kg or lbs
  reps INTEGER,
  rpe NUMERIC, -- Rate of Perceived Exertion (1-10)
  notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_started_at ON workouts(started_at DESC);
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_sets_workout_exercise_id ON sets(workout_exercise_id);
```

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### profiles
- Users can view all profiles
- Users can only update their own profile

### workouts, workout_exercises, sets
- Users can only view/insert/update/delete their own data
- Based on `user_id` matching `auth.uid()`

### exercises
- All users can view exercises
- Only authenticated users can suggest new exercises (pending approval)

## Functions

### `calculate_workout_duration()`
Trigger function to calculate workout duration when `completed_at` is set.

### `calculate_workout_volume()`
Trigger function to calculate total volume for a workout.

## Future Schema Additions

- `exercise_templates` - Pre-built workout templates
- `personal_records` - Track PRs for each exercise
- `body_metrics` - Body weight, measurements
- `achievements` - Gamification system
