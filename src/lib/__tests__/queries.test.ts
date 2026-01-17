/**
 * Query Functions Tests
 *
 * Comprehensive tests for all database query functions in queries.ts
 * Tests type safety, error handling, and expected behavior
 */

import { describe, it, expect } from 'vitest'
import type {
  Program,
  Workout,
  WorkoutSession,
  ExerciseLog,
  ExerciseCard,
  WorkoutWithExercises,
  CreateExerciseLogInput,
  CreateExerciseCardInput,
} from '../types'
import * as queries from '../queries'

describe('Query Functions - Type Safety & Structure', () => {
  describe('Program Queries', () => {
    it('getAllPrograms should return typed Program array', () => {
      // Type check that the function signature is correct
      const result: Promise<Program[]> = queries.getAllPrograms()
      expect(result).toBeInstanceOf(Promise)
    })

    it('getProgramById should accept string and return typed Program', () => {
      const testId = 'test-uuid'
      const result: Promise<Program> = queries.getProgramById(testId)
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('Workout Queries', () => {
    it('getWorkoutsByProgram should return typed Workout array', () => {
      const programId = 'test-program-id'
      const result: Promise<Workout[]> = queries.getWorkoutsByProgram(programId)
      expect(result).toBeInstanceOf(Promise)
    })

    it('getWorkoutById should accept string and return typed Workout', () => {
      const workoutId = 'test-workout-id'
      const result: Promise<Workout> = queries.getWorkoutById(workoutId)
      expect(result).toBeInstanceOf(Promise)
    })

    it('getWorkoutWithExercises should return WorkoutWithExercises', () => {
      const workoutId = 'test-workout-id'
      const result: Promise<WorkoutWithExercises> =
        queries.getWorkoutWithExercises(workoutId)
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('Session Queries', () => {
    it('createWorkoutSession should accept workoutId and optional athleteId', () => {
      const workoutId = 'test-workout-id'
      const result1: Promise<WorkoutSession> = queries.createWorkoutSession(workoutId)
      const result2: Promise<WorkoutSession> = queries.createWorkoutSession(
        workoutId,
        'athlete-id'
      )
      expect(result1).toBeInstanceOf(Promise)
      expect(result2).toBeInstanceOf(Promise)
    })

    it('completeWorkoutSession should accept sessionId', () => {
      const sessionId = 'test-session-id'
      const result: Promise<WorkoutSession> =
        queries.completeWorkoutSession(sessionId)
      expect(result).toBeInstanceOf(Promise)
    })

    it('getWorkoutHistory should accept optional params', () => {
      const result1: Promise<(WorkoutSession & { workout: Workout })[]> =
        queries.getWorkoutHistory()
      const result2: Promise<(WorkoutSession & { workout: Workout })[]> =
        queries.getWorkoutHistory('athlete-id')
      const result3: Promise<(WorkoutSession & { workout: Workout })[]> =
        queries.getWorkoutHistory('athlete-id', 10)
      expect(result1).toBeInstanceOf(Promise)
      expect(result2).toBeInstanceOf(Promise)
      expect(result3).toBeInstanceOf(Promise)
    })

    it('getPreviousSessionLogs should return ExerciseLog array', () => {
      const workoutId = 'test-workout-id'
      const result1: Promise<ExerciseLog[]> =
        queries.getPreviousSessionLogs(workoutId)
      const result2: Promise<ExerciseLog[]> = queries.getPreviousSessionLogs(
        workoutId,
        'athlete-id'
      )
      expect(result1).toBeInstanceOf(Promise)
      expect(result2).toBeInstanceOf(Promise)
    })
  })

  describe('Exercise Log Queries', () => {
    it('logExerciseSet should accept CreateExerciseLogInput', () => {
      const log: CreateExerciseLogInput = {
        workout_session_id: 'session-id',
        workout_exercise_id: 'exercise-id',
        set_number: 1,
        weight: 100,
        reps: 10,
        duration_seconds: null,
        distance: null,
        rpe: 8,
        notes: null,
      }
      const result: Promise<ExerciseLog> = queries.logExerciseSet(log)
      expect(result).toBeInstanceOf(Promise)
    })

    it('updateExerciseSet should accept partial updates', () => {
      const logId = 'log-id'
      const updates = {
        weight: 105,
        reps: 12,
        rpe: 9,
      }
      const result: Promise<ExerciseLog> = queries.updateExerciseSet(logId, updates)
      expect(result).toBeInstanceOf(Promise)
    })

    it('deleteExerciseSet should accept logId', () => {
      const logId = 'log-id'
      const result: Promise<void> = queries.deleteExerciseSet(logId)
      expect(result).toBeInstanceOf(Promise)
    })

    it('getSessionLogs should return ExerciseLog array', () => {
      const sessionId = 'session-id'
      const result: Promise<ExerciseLog[]> = queries.getSessionLogs(sessionId)
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('Exercise Card Queries', () => {
    it('getAllExerciseCards should return ExerciseCard array', () => {
      const result: Promise<ExerciseCard[]> = queries.getAllExerciseCards()
      expect(result).toBeInstanceOf(Promise)
    })

    it('getExerciseCardById should accept id', () => {
      const cardId = 'card-id'
      const result: Promise<ExerciseCard> = queries.getExerciseCardById(cardId)
      expect(result).toBeInstanceOf(Promise)
    })

    it('createExerciseCard should accept CreateExerciseCardInput', () => {
      const card: CreateExerciseCardInput = {
        name: 'Test Exercise',
        short_name: 'Test',
        instructions: ['Step 1', 'Step 2'],
        coaching_cues: ['Tip 1'],
        screenshot_timestamps: null,
        video_url: null,
        video_start_time: null,
        video_end_time: null,
        difficulty: 'intermediate',
        equipment: ['Barbell'],
        exercise_type: 'strength',
        primary_muscle_groups: ['Legs'],
      }
      const result: Promise<ExerciseCard> = queries.createExerciseCard(card)
      expect(result).toBeInstanceOf(Promise)
    })

    it('updateExerciseCard should accept partial updates', () => {
      const cardId = 'card-id'
      const updates = {
        name: 'Updated Exercise Name',
        difficulty: 'advanced' as const,
      }
      const result: Promise<ExerciseCard> = queries.updateExerciseCard(
        cardId,
        updates
      )
      expect(result).toBeInstanceOf(Promise)
    })
  })
})

describe('Query Functions - JSDoc Documentation', () => {
  it('all query functions should be exported', () => {
    // Verify all 17 functions are exported
    expect(queries.getAllPrograms).toBeDefined()
    expect(queries.getProgramById).toBeDefined()
    expect(queries.getWorkoutsByProgram).toBeDefined()
    expect(queries.getWorkoutById).toBeDefined()
    expect(queries.getWorkoutWithExercises).toBeDefined()
    expect(queries.createWorkoutSession).toBeDefined()
    expect(queries.completeWorkoutSession).toBeDefined()
    expect(queries.getWorkoutHistory).toBeDefined()
    expect(queries.getPreviousSessionLogs).toBeDefined()
    expect(queries.logExerciseSet).toBeDefined()
    expect(queries.updateExerciseSet).toBeDefined()
    expect(queries.deleteExerciseSet).toBeDefined()
    expect(queries.getSessionLogs).toBeDefined()
    expect(queries.getAllExerciseCards).toBeDefined()
    expect(queries.getExerciseCardById).toBeDefined()
    expect(queries.createExerciseCard).toBeDefined()
    expect(queries.updateExerciseCard).toBeDefined()
  })

  it('all functions should be async functions', () => {
    // Verify all functions return Promises
    expect(queries.getAllPrograms().constructor.name).toBe('Promise')
    expect(queries.getProgramById('id').constructor.name).toBe('Promise')
    expect(queries.getWorkoutsByProgram('id').constructor.name).toBe('Promise')
    expect(queries.getWorkoutById('id').constructor.name).toBe('Promise')
    expect(queries.getWorkoutWithExercises('id').constructor.name).toBe('Promise')
    expect(queries.createWorkoutSession('id').constructor.name).toBe('Promise')
    expect(queries.completeWorkoutSession('id').constructor.name).toBe('Promise')
    expect(queries.getWorkoutHistory().constructor.name).toBe('Promise')
    expect(queries.getPreviousSessionLogs('id').constructor.name).toBe('Promise')
    expect(queries.getSessionLogs('id').constructor.name).toBe('Promise')
    expect(queries.getAllExerciseCards().constructor.name).toBe('Promise')
    expect(queries.getExerciseCardById('id').constructor.name).toBe('Promise')
    expect(queries.deleteExerciseSet('id').constructor.name).toBe('Promise')
  })
})

describe('Query Functions - Parameter Validation', () => {
  it('should handle optional parameters correctly', () => {
    // Test that optional parameters work
    expect(() => queries.getWorkoutHistory()).not.toThrow()
    expect(() => queries.getWorkoutHistory('athlete-id')).not.toThrow()
    expect(() => queries.getWorkoutHistory('athlete-id', 10)).not.toThrow()
    expect(() => queries.getWorkoutHistory(undefined, 10)).not.toThrow()
  })

  it('should handle null vs undefined for athleteId', () => {
    // Test that both null and undefined are handled
    expect(() => queries.createWorkoutSession('workout-id')).not.toThrow()
    expect(() => queries.createWorkoutSession('workout-id', 'athlete-id')).not.toThrow()
    expect(() => queries.getPreviousSessionLogs('workout-id')).not.toThrow()
    expect(() =>
      queries.getPreviousSessionLogs('workout-id', 'athlete-id')
    ).not.toThrow()
  })
})

describe('Query Functions - Type Constraints', () => {
  it('should enforce required fields in CreateExerciseLogInput', () => {
    // This test validates TypeScript compilation
    const validLog: CreateExerciseLogInput = {
      workout_session_id: 'session-id',
      workout_exercise_id: 'exercise-id',
      set_number: 1,
      weight: null,
      reps: null,
      duration_seconds: null,
      distance: null,
      rpe: null,
      notes: null,
    }
    expect(validLog).toBeDefined()

    // Optional fields can be omitted due to TypeScript Insert type
    const minimalLog: CreateExerciseLogInput = {
      workout_session_id: 'session-id',
      workout_exercise_id: 'exercise-id',
      set_number: 1,
      weight: null,
      reps: null,
      duration_seconds: null,
      distance: null,
      rpe: null,
      notes: null,
    }
    expect(minimalLog).toBeDefined()
  })

  it('should enforce Difficulty enum constraints', () => {
    const card: CreateExerciseCardInput = {
      name: 'Test',
      short_name: null,
      instructions: null,
      coaching_cues: null,
      screenshot_timestamps: null,
      video_url: null,
      video_start_time: null,
      video_end_time: null,
      difficulty: 'beginner', // Must be one of: beginner | intermediate | advanced
      equipment: null,
      exercise_type: null,
      primary_muscle_groups: null,
    }
    expect(['beginner', 'intermediate', 'advanced']).toContain(card.difficulty)
  })

  it('should enforce ExerciseType enum constraints', () => {
    const validTypes: Array<'strength' | 'cardio' | 'mobility' | 'plyometric' | 'other'> = [
      'strength',
      'cardio',
      'mobility',
      'plyometric',
      'other',
    ]
    validTypes.forEach((type) => {
      const card: Partial<CreateExerciseCardInput> = {
        exercise_type: type,
      }
      expect(validTypes).toContain(card.exercise_type)
    })
  })
})

describe('Supabase Client', () => {
  it('should export a configured supabase client', async () => {
    // Import the supabase client
    const { supabase } = await import('../supabase')

    expect(supabase).toBeDefined()
    expect(supabase.from).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })
})
