/**
 * Database Query Functions
 *
 * All database interactions should go through these functions.
 * These functions use the Supabase client and return typed data.
 */

import { supabase } from './supabase'
import type {
  Profile,
  ProfileUpdate,
  Exercise,
  ExerciseInsert,
  Workout,
  WorkoutInsert,
  WorkoutUpdate,
  WorkoutExercise,
  WorkoutExerciseInsert,
  Set,
  SetInsert,
  SetUpdate,
  WorkoutWithExercises,
} from './types'

// ========================================
// Authentication
// ========================================

export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({ email, password })
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// ========================================
// Profiles
// ========================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data: data as Profile | null, error }
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data: data as Profile | null, error }
}

// ========================================
// Exercises
// ========================================

export async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  return { data: data as Exercise[] | null, error }
}

export async function getExerciseById(id: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as Exercise | null, error }
}

export async function searchExercises(query: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })

  return { data: data as Exercise[] | null, error }
}

export async function createExercise(exercise: ExerciseInsert) {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single()

  return { data: data as Exercise | null, error }
}

// ========================================
// Workouts
// ========================================

export async function createWorkout(workout: WorkoutInsert) {
  const { data, error } = await supabase
    .from('workouts')
    .insert(workout)
    .select()
    .single()

  return { data: data as Workout | null, error }
}

export async function getWorkoutById(id: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      `
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        sets (*)
      )
    `
    )
    .eq('id', id)
    .single()

  return { data: data as WorkoutWithExercises | null, error }
}

export async function getWorkoutHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)

  return { data: data as Workout[] | null, error }
}

export async function updateWorkout(id: string, updates: WorkoutUpdate) {
  const { data, error } = await supabase
    .from('workouts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Workout | null, error }
}

export async function deleteWorkout(id: string) {
  const { error } = await supabase.from('workouts').delete().eq('id', id)

  return { error }
}

export async function completeWorkout(id: string) {
  return await updateWorkout(id, {
    completed_at: new Date().toISOString(),
  })
}

// ========================================
// Workout Exercises
// ========================================

export async function addExerciseToWorkout(workoutExercise: WorkoutExerciseInsert) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert(workoutExercise)
    .select()
    .single()

  return { data: data as WorkoutExercise | null, error }
}

export async function removeExerciseFromWorkout(workoutExerciseId: string) {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', workoutExerciseId)

  return { error }
}

// ========================================
// Sets
// ========================================

export async function addSet(set: SetInsert) {
  const { data, error } = await supabase.from('sets').insert(set).select().single()

  return { data: data as Set | null, error }
}

export async function updateSet(id: string, updates: SetUpdate) {
  const { data, error } = await supabase
    .from('sets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Set | null, error }
}

export async function deleteSet(id: string) {
  const { error } = await supabase.from('sets').delete().eq('id', id)

  return { error }
}

export async function completeSet(id: string) {
  return await updateSet(id, {
    completed_at: new Date().toISOString(),
  })
}
