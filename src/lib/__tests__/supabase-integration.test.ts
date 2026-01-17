/**
 * Supabase Integration Tests
 *
 * This file validates that our TypeScript types work correctly with Supabase client operations.
 * These tests demonstrate proper usage patterns and verify type safety.
 *
 * NOTE: These tests require real Supabase credentials to run.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
 * Tests will be skipped if credentials are not available.
 *
 * Run with: npm test or npx vitest
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type {
  Database,
  Program,
  CreateProgramInput,
  UpdateProgramInput,
} from '../types';

// Check if we have real Supabase credentials
const hasSupabaseCredentials =
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_ANON_KEY &&
  !process.env.VITE_SUPABASE_URL.includes('mock');

// Skip tests if no real credentials
const describeIfSupabase = hasSupabaseCredentials ? describe : describe.skip;

describeIfSupabase('Supabase Integration', () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeAll(() => {
    // Create typed Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
    supabase = createClient<Database>(supabaseUrl, supabaseKey);
  });

  describe('Type-safe CRUD Operations', () => {
    it('should type-check SELECT queries', async () => {
      // This validates that the return type is correctly inferred
      const { data } = await supabase
        .from('programs')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        // TypeScript should know these fields exist
        expect(typeof data.id).toBe('string');
        expect(typeof data.name).toBe('string');
        expect(typeof data.created_at).toBe('string');

        // Verify the data matches Program type
        const program: Program = data;
        expect(program).toBeDefined();
      }
    });

    it('should type-check INSERT operations', async () => {
      const newProgram: CreateProgramInput = {
        name: 'Test Program',
        sport: 'Baseball',
        season: 'Summer 2024',
        description: 'Test description',
      };

      const { data } = await supabase
        .from('programs')
        .insert(newProgram)
        .select()
        .maybeSingle();

      if (data) {
        expect(data.name).toBe('Test Program');
        expect(data.sport).toBe('Baseball');
      }
    });

    it('should type-check UPDATE operations', async () => {
      const update: UpdateProgramInput = {
        name: 'Updated Program Name',
        description: 'Updated description',
      };

      // First create a program to update
      const { data: createdProgram } = await supabase
        .from('programs')
        .insert({ name: 'Temp Program', sport: null, season: null, description: null })
        .select()
        .single();

      if (createdProgram) {
        const { data } = await supabase
          .from('programs')
          .update(update)
          .eq('id', createdProgram.id)
          .select()
          .maybeSingle();

        if (data) {
          expect(typeof data.updated_at).toBe('string');
        }

        // Cleanup
        await supabase.from('programs').delete().eq('id', createdProgram.id);
      }
    });

    it('should type-check DELETE operations', async () => {
      // First create a program to delete
      const { data: createdProgram } = await supabase
        .from('programs')
        .insert({ name: 'Temp Program', sport: null, season: null, description: null })
        .select()
        .single();

      if (createdProgram) {
        const { error } = await supabase
          .from('programs')
          .delete()
          .eq('id', createdProgram.id);

        // Type-safe error handling
        expect(error).toBeNull();
      }
    });
  });

  describe('Complex Queries with Joins', () => {
    it('should type-check joined queries for WorkoutWithExercises', async () => {
      const { data } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            *,
            exercise_card:exercise_cards(*)
          )
        `)
        .limit(1)
        .maybeSingle();

      if (data && data.exercises) {
        // This should match WorkoutWithExercises structure
        expect(Array.isArray(data.exercises)).toBe(true);

        if (data.exercises.length > 0) {
          const firstExercise = data.exercises[0];
          expect(firstExercise.exercise_card).toBeDefined();
        }
      }
    });

    it('should handle workout sessions with nested data', async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout:workouts(
            *,
            program:programs(*)
          )
        `)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const session = data[0];
        expect(session.workout_id).toBeDefined();
        expect(typeof session.started_at).toBe('string');
      }
    });
  });

  describe('JSONB Field Operations', () => {
    it('should handle prescribed_sets JSONB array', async () => {
      const { data } = await supabase
        .from('workout_exercises')
        .select('prescribed_sets')
        .limit(1)
        .maybeSingle();

      if (data) {
        // prescribed_sets should be typed as PrescribedSet[]
        expect(Array.isArray(data.prescribed_sets)).toBe(true);

        if (data.prescribed_sets.length > 0) {
          const firstSet = data.prescribed_sets[0];
          expect(typeof firstSet.set).toBe('number');
        }
      }
    });

    it('should handle exercise_card JSONB arrays', async () => {
      const { data } = await supabase
        .from('exercise_cards')
        .select('instructions, coaching_cues, equipment')
        .limit(1)
        .maybeSingle();

      if (data) {
        // These should be typed as string[] | null
        if (data.instructions) {
          expect(Array.isArray(data.instructions)).toBe(true);
        }

        if (data.coaching_cues) {
          expect(Array.isArray(data.coaching_cues)).toBe(true);
        }

        if (data.equipment) {
          expect(Array.isArray(data.equipment)).toBe(true);
        }
      }
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter by enum values', async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .in('status', ['in_progress', 'completed'])
        .limit(10);

      if (data) {
        data.forEach((session) => {
          expect(['in_progress', 'completed', 'skipped']).toContain(session.status);
        });
      }
    });

    it('should filter exercise_cards by difficulty', async () => {
      const { data } = await supabase
        .from('exercise_cards')
        .select('*')
        .eq('difficulty', 'intermediate')
        .limit(10);

      if (data) {
        data.forEach((card) => {
          if (card.difficulty) {
            expect(['beginner', 'intermediate', 'advanced']).toContain(card.difficulty);
          }
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values correctly', async () => {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .is('sport', null)
        .limit(10);

      if (data) {
        data.forEach((program) => {
          expect(program.sport).toBeNull();
        });
      }
    });

    it('should handle optional fields in inserts', async () => {
      const minimalProgram: CreateProgramInput = {
        name: 'Minimal Program',
        sport: null,
        season: null,
        description: null,
      };

      const { data } = await supabase
        .from('programs')
        .insert(minimalProgram)
        .select()
        .maybeSingle();

      if (data) {
        expect(data.name).toBe('Minimal Program');
        expect(data.id).toBeDefined(); // Should be auto-generated

        // Cleanup
        await supabase.from('programs').delete().eq('id', data.id);
      }
    });
  });
});

/**
 * Example: Creating a type-safe Supabase client wrapper
 */
export function createTypedSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Example: Type-safe query helper functions
 */
export class ProgramRepository {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async getAll(): Promise<Program[]> {
    const { data, error } = await this.supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Program | null> {
    const { data, error } = await this.supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(input: CreateProgramInput): Promise<Program> {
    const { data, error } = await this.supabase
      .from('programs')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create program');
    return data;
  }

  async update(id: string, input: UpdateProgramInput): Promise<Program> {
    const { data, error } = await this.supabase
      .from('programs')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update program');
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
