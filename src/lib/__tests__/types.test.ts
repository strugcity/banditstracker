/**
 * Type Definition Tests
 *
 * This file validates that our TypeScript types are correctly defined
 * and work as expected with Supabase operations.
 *
 * Run with: npm test or npx vitest
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  Program,
  Workout,
  ExerciseCard,
  WorkoutExercise,
  PrescribedSet,
  Difficulty,
  WorkoutSessionStatus,
  Tables,
  TablesInsert,
  TablesUpdate,
  WorkoutWithExercises,
  CreateProgramInput,
  UpdateProgramInput,
} from '../types';

describe('Type Definitions', () => {
  describe('Base Types', () => {
    it('should define Program type correctly', () => {
      const program: Program = {
        id: 'uuid-here',
        name: 'Gophers Summer 2024',
        sport: 'Baseball',
        season: 'Summer 2024',
        description: 'Test program',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(program.name).toBe('Gophers Summer 2024');
      expectTypeOf(program.id).toBeString();
      expectTypeOf(program.sport).toEqualTypeOf<string | null>();
    });

    it('should define Workout type correctly', () => {
      const workout: Workout = {
        id: 'uuid-here',
        program_id: 'program-uuid',
        name: 'Monday - Week 1',
        day_of_week: 'Monday',
        week_number: 1,
        workout_order: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(workout.name).toBe('Monday - Week 1');
      expectTypeOf(workout.week_number).toEqualTypeOf<number | null>();
    });

    it('should define ExerciseCard type correctly', () => {
      const exerciseCard: ExerciseCard = {
        id: 'uuid-here',
        name: 'Front Squat',
        short_name: 'F. Squat',
        instructions: ['Step 1', 'Step 2'],
        coaching_cues: ['Keep chest up', 'Drive through heels'],
        screenshot_timestamps: ['01:30', '02:15'],
        video_url: 'https://youtube.com/watch?v=xyz',
        video_start_time: '01:00',
        video_end_time: '03:00',
        difficulty: 'intermediate',
        equipment: ['Barbell', 'Squat Rack'],
        exercise_type: 'strength',
        primary_muscle_groups: ['Quadriceps', 'Glutes'],
        tracks_weight: true,
        tracks_reps: true,
        tracks_duration: false,
        tracks_distance: false,
        default_rest_seconds: 120,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(exerciseCard.name).toBe('Front Squat');
      expectTypeOf(exerciseCard.instructions).toEqualTypeOf<string[] | null>();
      expectTypeOf(exerciseCard.difficulty).toEqualTypeOf<Difficulty | null>();
    });
  });

  describe('Structured Types', () => {
    it('should define PrescribedSet correctly', () => {
      const prescribedSet: PrescribedSet = {
        set: 1,
        weight_pct: 75,
        reps: 5,
        tempo: '3010',
        notes: 'Focus on form',
      };

      expect(prescribedSet.set).toBe(1);
      expectTypeOf(prescribedSet.weight_pct).toEqualTypeOf<number | undefined>();
    });

    it('should define WorkoutExercise with prescribed_sets array', () => {
      const workoutExercise: WorkoutExercise = {
        id: 'uuid-here',
        workout_id: 'workout-uuid',
        exercise_card_id: 'exercise-uuid',
        exercise_order: 1,
        superset_group: '1a',
        prescribed_sets: [
          { set: 1, weight_pct: 55, reps: 5 },
          { set: 2, weight_pct: 65, reps: 5 },
          { set: 3, weight_pct: 75, reps: 5 },
        ],
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(workoutExercise.prescribed_sets.length).toBe(3);
      expectTypeOf(workoutExercise.prescribed_sets).toEqualTypeOf<PrescribedSet[]>();
    });
  });

  describe('Enums', () => {
    it('should restrict Difficulty to valid values', () => {
      const difficulty: Difficulty = 'intermediate';
      expect(difficulty).toBe('intermediate');
      expectTypeOf(difficulty).toMatchTypeOf<Difficulty>();
    });

    it('should restrict WorkoutSessionStatus to valid values', () => {
      const status: WorkoutSessionStatus = 'in_progress';
      expect(status).toBe('in_progress');
      expectTypeOf(status).toMatchTypeOf<WorkoutSessionStatus>();
    });
  });

  describe('Database Helper Types', () => {
    it('should extract Row type correctly', () => {
      type ProgramRow = Tables<'programs'>;
      expectTypeOf<ProgramRow>().toEqualTypeOf<Program>();
    });

    it('should extract Insert type correctly', () => {
      type ProgramInsert = TablesInsert<'programs'>;

      const insert: ProgramInsert = {
        name: 'New Program',
        sport: 'Basketball',
        season: 'Fall 2024',
        description: null,
      };

      expect(insert.name).toBe('New Program');
      // id, created_at, updated_at should be optional
      expectTypeOf<ProgramInsert['id']>().toEqualTypeOf<string | undefined>();
    });

    it('should extract Update type correctly', () => {
      type ProgramUpdate = TablesUpdate<'programs'>;

      const update: ProgramUpdate = {
        name: 'Updated Program',
      };

      expect(update.name).toBe('Updated Program');
      // All fields should be optional for updates
      expectTypeOf<ProgramUpdate['sport']>().toEqualTypeOf<string | null | undefined>();
    });
  });

  describe('Extended Types', () => {
    it('should define WorkoutWithExercises correctly', () => {
      const workoutWithExercises: WorkoutWithExercises = {
        id: 'workout-uuid',
        program_id: 'program-uuid',
        name: 'Monday Workout',
        day_of_week: 'Monday',
        week_number: 1,
        workout_order: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        exercises: [
          {
            id: 'we-uuid',
            workout_id: 'workout-uuid',
            exercise_card_id: 'ec-uuid',
            exercise_order: 1,
            superset_group: null,
            prescribed_sets: [{ set: 1, reps: 10 }],
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            exercise_card: {
              id: 'ec-uuid',
              name: 'Front Squat',
              short_name: null,
              instructions: null,
              coaching_cues: null,
              screenshot_timestamps: null,
              video_url: null,
              video_start_time: null,
              video_end_time: null,
              difficulty: null,
              equipment: null,
              exercise_type: null,
              primary_muscle_groups: null,
              tracks_weight: true,
              tracks_reps: true,
              tracks_duration: false,
              tracks_distance: false,
              default_rest_seconds: 90,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        ],
      };

      expect(workoutWithExercises.exercises.length).toBe(1);
      expect(workoutWithExercises.exercises[0]?.exercise_card.name).toBe('Front Squat');
    });
  });

  describe('Utility Types', () => {
    it('should define CreateProgramInput correctly', () => {
      const input: CreateProgramInput = {
        name: 'Test Program',
        sport: 'Baseball',
        season: 'Summer 2024',
        description: null,
      };

      expect(input.name).toBe('Test Program');
    });

    it('should define UpdateProgramInput correctly', () => {
      const input: UpdateProgramInput = {
        name: 'Updated Name',
      };

      expect(input.name).toBe('Updated Name');
    });
  });

  describe('Null Handling', () => {
    it('should allow null for optional fields', () => {
      const program: Program = {
        id: 'uuid',
        name: 'Test',
        sport: null,
        season: null,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(program.sport).toBeNull();
    });

    it('should allow arrays or null for JSONB fields', () => {
      const exerciseCard: ExerciseCard = {
        id: 'uuid',
        name: 'Test',
        short_name: null,
        instructions: null,
        coaching_cues: null,
        screenshot_timestamps: null,
        video_url: null,
        video_start_time: null,
        video_end_time: null,
        difficulty: null,
        equipment: null,
        exercise_type: null,
        primary_muscle_groups: null,
        tracks_weight: true,
        tracks_reps: true,
        tracks_duration: false,
        tracks_distance: false,
        default_rest_seconds: 90,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(exerciseCard.instructions).toBeNull();
    });
  });
});
