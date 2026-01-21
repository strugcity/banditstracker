/**
 * Database Query Functions for Bandits Training Tracker
 *
 * Centralized query functions for all database operations.
 * All functions use async/await and throw errors for React Query to handle.
 */

import { supabase } from './supabase'
import type {
  Program,
  Workout,
  WorkoutWithExercises,
  WorkoutSession,
  ExerciseLog,
  ExerciseCard,
  WorkoutExercise,
  CreateExerciseLogInput,
  UpdateExerciseLogInput,
  CreateExerciseCardInput,
  UpdateExerciseCardInput,
} from './types'

// ============================================================================
// PROGRAM QUERIES
// ============================================================================

/**
 * Get all training programs
 *
 * @returns Array of all programs ordered by creation date (newest first)
 * @throws Error if query fails
 */
export async function getAllPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single program by ID
 *
 * @param id - Program UUID
 * @returns Program data
 * @throws Error if program not found or query fails
 */
export async function getProgramById(id: string): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// WORKOUT QUERIES
// ============================================================================

/**
 * Get all workouts for a specific program
 *
 * @param programId - Program UUID
 * @returns Array of workouts ordered by workout_order
 * @throws Error if query fails
 */
export async function getWorkoutsByProgram(programId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('program_id', programId)
    .order('workout_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Get a single workout by ID
 *
 * @param id - Workout UUID
 * @returns Workout data
 * @throws Error if workout not found or query fails
 */
export async function getWorkoutById(id: string): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Get a workout with all its exercises and exercise cards
 *
 * PERFORMANCE: Optimized to fetch only essential exercise_card fields needed
 * for workout execution. Heavy JSONB fields (instructions, coaching_cues) are
 * excluded to reduce payload size by ~70% on mobile networks.
 *
 * For full exercise details (e.g., in a modal), use getExerciseCardById().
 *
 * @param workoutId - Workout UUID
 * @returns Workout with nested exercises and essential exercise card data
 * @throws Error if workout not found or query fails
 */
export async function getWorkoutWithExercises(
  workoutId: string
): Promise<WorkoutWithExercises> {
  // Get workout
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single()

  if (workoutError) throw workoutError
  if (!workout) throw new Error('Workout not found')

  // Get exercises with essential card fields only (optimized for mobile)
  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise_card:exercise_cards(
        id,
        name,
        short_name,
        exercise_type,
        tracks_weight,
        tracks_reps,
        tracks_time,
        tracks_distance,
        default_rest_seconds
      )
    `)
    .eq('workout_id', workoutId)
    .order('exercise_order', { ascending: true })

  if (exercisesError) throw exercisesError

  // Handle null/undefined exercises (return empty array instead)
  const exercisesArray = exercises || []

  return {
    ...(workout as Workout),
    exercises: exercisesArray as (WorkoutExercise & { exercise_card: ExerciseCard })[],
  } as WorkoutWithExercises
}

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Create a new workout session
 *
 * SECURITY: athleteId is REQUIRED. RLS policies enforce that users can only
 * create sessions for themselves. This prevents orphaned records and ensures
 * proper data attribution in the multi-tenant system.
 *
 * @param workoutId - Workout UUID
 * @param athleteId - Athlete ID (REQUIRED - must be current user's ID)
 * @returns Created workout session
 * @throws Error if creation fails or RLS policy rejects
 */
export async function createWorkoutSession(
  workoutId: string,
  athleteId: string
): Promise<WorkoutSession> {
  if (!athleteId) {
    throw new Error('athleteId is required to create a workout session')
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      workout_id: workoutId,
      athlete_id: athleteId,
      started_at: new Date().toISOString(),
      status: 'in_progress' as const,
      completed_at: null,
      notes: null,
    } as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create workout session')
  return data as WorkoutSession
}

/**
 * Mark a workout session as completed
 *
 * @param sessionId - Workout session UUID
 * @returns Updated workout session
 * @throws Error if update fails
 */
export async function completeWorkoutSession(sessionId: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    // @ts-expect-error - Supabase type inference issue with update operations
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed' as const,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to complete workout session')
  return data as WorkoutSession
}

/**
 * Get workout history with workout details
 *
 * SECURITY: athleteId is REQUIRED. While RLS policies prevent actual data leaks,
 * the code must be explicit about filtering. Admin users (coaches) should use
 * team-specific queries to view athlete data.
 *
 * PERFORMANCE: Optimized to fetch only essential workout fields, not full workout
 * data, reducing payload size for mobile devices.
 *
 * @param athleteId - Athlete ID (REQUIRED - typically current user's ID)
 * @param limit - Maximum number of sessions to return (default: 20)
 * @returns Array of completed workout sessions with essential workout details
 * @throws Error if query fails
 */
export async function getWorkoutHistory(
  athleteId: string,
  limit: number = 20
): Promise<(WorkoutSession & { workout: Workout })[]> {
  if (!athleteId) {
    throw new Error('athleteId is required to fetch workout history')
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout:workouts(id, name, description, program_id, workout_order)
    `)
    .eq('athlete_id', athleteId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as (WorkoutSession & { workout: Workout })[]
}

/**
 * Get exercise logs from the most recent completed session for a workout
 *
 * Used to display previous performance when logging a new workout.
 *
 * SECURITY: athleteId is REQUIRED to ensure users only see their own previous
 * workout data. RLS policies provide defense-in-depth, but explicit filtering
 * is required at the application level.
 *
 * @param workoutId - Workout UUID
 * @param athleteId - Athlete ID (REQUIRED - typically current user's ID)
 * @returns Array of exercise logs from the previous session, or empty array if no previous session
 * @throws Error if query fails
 */
export async function getPreviousSessionLogs(
  workoutId: string,
  athleteId: string
): Promise<ExerciseLog[]> {
  if (!athleteId) {
    throw new Error('athleteId is required to fetch previous session logs')
  }

  // First, find the most recent completed session for this workout
  const { data: sessions, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('athlete_id', athleteId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)

  if (sessionError) throw sessionError
  if (!sessions || sessions.length === 0) {
    return [] // No previous session found
  }

  const previousSessionId = (sessions as { id: string }[])[0]!.id

  // Get all exercise logs from that session
  const { data: logs, error: logsError } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('workout_session_id', previousSessionId)
    .order('set_number', { ascending: true })

  if (logsError) throw logsError
  return logs
}

// ============================================================================
// EXERCISE LOG QUERIES
// ============================================================================

/**
 * Log a new exercise set
 *
 * @param log - Exercise log data
 * @returns Created exercise log
 * @throws Error if creation fails
 */
export async function logExerciseSet(log: CreateExerciseLogInput): Promise<ExerciseLog> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .insert(log as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to log exercise set')
  return data as ExerciseLog
}

/**
 * Update an existing exercise set log
 *
 * @param logId - Exercise log UUID
 * @param updates - Fields to update
 * @returns Updated exercise log
 * @throws Error if update fails
 */
export async function updateExerciseSet(
  logId: string,
  updates: UpdateExerciseLogInput
): Promise<ExerciseLog> {
  const { data, error } = await supabase
    .from('exercise_logs')
    // @ts-expect-error - Supabase type inference issue with update operations
    .update(updates)
    .eq('id', logId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to update exercise set')
  return data as ExerciseLog
}

/**
 * Delete an exercise set log
 *
 * @param logId - Exercise log UUID
 * @throws Error if deletion fails
 */
export async function deleteExerciseSet(logId: string): Promise<void> {
  const { error } = await supabase.from('exercise_logs').delete().eq('id', logId)

  if (error) throw error
}

/**
 * Get all exercise logs for a workout session
 *
 * @param sessionId - Workout session UUID
 * @returns Array of exercise logs with exercise and card details, ordered by set number
 * @throws Error if query fails
 */
export async function getSessionLogs(
  sessionId: string
): Promise<
  (ExerciseLog & {
    workout_exercise: {
      exercise_card: ExerciseCard
      superset_group: string | null
    }
  })[]
> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select(`
      *,
      workout_exercise:workout_exercises(
        superset_group,
        exercise_card:exercise_cards(*)
      )
    `)
    .eq('workout_session_id', sessionId)
    .order('set_number', { ascending: true })

  if (error) throw error
  return data as any
}

// ============================================================================
// EXERCISE CARD QUERIES
// ============================================================================

/**
 * Get all exercise cards from the library (FULL DATA)
 *
 * WARNING: This loads ALL fields including heavy JSONB columns (instructions,
 * coaching_cues). Use getAllExerciseCardsList() for list/picker views to
 * optimize mobile performance.
 *
 * @returns Array of all exercise cards ordered alphabetically by name
 * @throws Error if query fails
 */
export async function getAllExerciseCards(): Promise<ExerciseCard[]> {
  const { data, error } = await supabase
    .from('exercise_cards')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Get exercise cards list for pickers/dropdowns (OPTIMIZED)
 *
 * PERFORMANCE: Only fetches essential fields (id, name, short_name, exercise_type)
 * to minimize payload size. Use this for list views, pickers, and search results.
 * Reduces data transfer by ~80% compared to getAllExerciseCards().
 *
 * For full exercise card details (instructions, cues, etc.), use getExerciseCardById().
 *
 * @returns Array of exercise cards with essential fields only
 * @throws Error if query fails
 */
export async function getAllExerciseCardsList(): Promise<
  Pick<ExerciseCard, 'id' | 'name' | 'short_name' | 'exercise_type'>[]
> {
  const { data, error } = await supabase
    .from('exercise_cards')
    .select('id, name, short_name, exercise_type')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Get a single exercise card by ID
 *
 * @param id - Exercise card UUID
 * @returns Exercise card data
 * @throws Error if exercise card not found or query fails
 */
export async function getExerciseCardById(id: string): Promise<ExerciseCard> {
  const { data, error } = await supabase
    .from('exercise_cards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new exercise card
 *
 * Used by the video service to add new exercises to the library.
 *
 * @param card - Exercise card data
 * @returns Created exercise card
 * @throws Error if creation fails
 */
export async function createExerciseCard(
  card: CreateExerciseCardInput
): Promise<ExerciseCard> {
  const { data, error } = await supabase
    .from('exercise_cards')
    .insert(card as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create exercise card')
  return data as ExerciseCard
}

/**
 * Update an existing exercise card
 *
 * @param id - Exercise card UUID
 * @param updates - Fields to update
 * @returns Updated exercise card
 * @throws Error if update fails
 */
export async function updateExerciseCard(
  id: string,
  updates: UpdateExerciseCardInput
): Promise<ExerciseCard> {
  const { data, error } = await supabase
    .from('exercise_cards')
    // @ts-expect-error - Supabase type inference issue with update operations
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to update exercise card')
  return data as ExerciseCard
}
