/**
 * TypeScript type definitions for Bandits Training Tracker
 *
 * These types should be kept in sync with the database schema.
 * In production, consider generating these types from Supabase CLI:
 * `npx supabase gen types typescript --project-id <project-id> > src/lib/types.ts`
 */

// ========================================
// Database Types
// ========================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      exercises: {
        Row: Exercise
        Insert: ExerciseInsert
        Update: ExerciseUpdate
      }
      workouts: {
        Row: Workout
        Insert: WorkoutInsert
        Update: WorkoutUpdate
      }
      workout_exercises: {
        Row: WorkoutExercise
        Insert: WorkoutExerciseInsert
        Update: WorkoutExerciseUpdate
      }
      sets: {
        Row: Set
        Insert: SetInsert
        Update: SetUpdate
      }
    }
  }
}

// ========================================
// Profile Types
// ========================================

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
}

export interface ProfileUpdate {
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
}

// ========================================
// Exercise Types
// ========================================

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'other'

export interface Exercise {
  id: string
  name: string
  description: string | null
  category: ExerciseCategory | null
  equipment: string[] | null
  video_url: string | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export interface ExerciseInsert {
  name: string
  description?: string | null
  category?: ExerciseCategory | null
  equipment?: string[] | null
  video_url?: string | null
  thumbnail_url?: string | null
}

export interface ExerciseUpdate {
  name?: string
  description?: string | null
  category?: ExerciseCategory | null
  equipment?: string[] | null
  video_url?: string | null
  thumbnail_url?: string | null
}

// ========================================
// Workout Types
// ========================================

export interface Workout {
  id: string
  user_id: string
  name: string
  notes: string | null
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  total_volume: number | null
  created_at: string
  updated_at: string
}

export interface WorkoutInsert {
  user_id: string
  name: string
  notes?: string | null
  started_at?: string
}

export interface WorkoutUpdate {
  name?: string
  notes?: string | null
  completed_at?: string | null
}

// ========================================
// Workout Exercise Types
// ========================================

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  order_index: number
  notes: string | null
  created_at: string
}

export interface WorkoutExerciseInsert {
  workout_id: string
  exercise_id: string
  order_index: number
  notes?: string | null
}

export interface WorkoutExerciseUpdate {
  order_index?: number
  notes?: string | null
}

// ========================================
// Set Types
// ========================================

export interface Set {
  id: string
  workout_exercise_id: string
  set_number: number
  weight: number | null
  reps: number | null
  rpe: number | null
  notes: string | null
  completed_at: string | null
  created_at: string
}

export interface SetInsert {
  workout_exercise_id: string
  set_number: number
  weight?: number | null
  reps?: number | null
  rpe?: number | null
  notes?: string | null
  completed_at?: string | null
}

export interface SetUpdate {
  weight?: number | null
  reps?: number | null
  rpe?: number | null
  notes?: string | null
  completed_at?: string | null
}

// ========================================
// Extended Types (with relations)
// ========================================

export interface WorkoutWithExercises extends Workout {
  workout_exercises: Array<
    WorkoutExercise & {
      exercise: Exercise
      sets: Set[]
    }
  >
}

export interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise
  sets: Set[]
}
