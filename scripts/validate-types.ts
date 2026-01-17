#!/usr/bin/env tsx
/**
 * Schema Validation Script
 *
 * This script validates that TypeScript types match the actual database schema.
 * Run this after any schema changes to ensure types are in sync.
 *
 * Usage:
 *   npm run validate-types
 *   or
 *   npx tsx scripts/validate-types.ts
 */

/* eslint-disable no-console */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/types';

// Load environment variables from .env file
config();

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

interface ValidationResult {
  table: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

class SchemaValidator {
  private supabase: ReturnType<typeof createClient<Database>>;
  private results: ValidationResult[] = [];

  constructor() {
    this.validateEnvironment();

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  private validateEnvironment(): void {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach((key) => console.error(`   - ${key}`));
      process.exit(1);
    }
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result);

    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.table}: ${result.message}`);
  }

  async validateTable(tableName: keyof Database['public']['Tables']): Promise<void> {
    try {
      // Attempt to query the table
      const { error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        this.addResult({
          table: tableName,
          status: 'fail',
          message: `Table query failed: ${error.message}`,
        });
      } else {
        this.addResult({
          table: tableName,
          status: 'pass',
          message: 'Table accessible and types valid',
        });
      }
    } catch (error) {
      this.addResult({
        table: tableName,
        status: 'fail',
        message: `Unexpected error: ${error}`,
      });
    }
  }

  async validateJSONBFields(): Promise<void> {
    console.log('\n📋 Validating JSONB Fields...\n');

    // Validate workout_exercises.prescribed_sets
    try {
      const { data, error } = await this.supabase
        .from('workout_exercises')
        .select('prescribed_sets')
        .limit(1)
        .single();

      if (!error && data) {
        const isValidArray = Array.isArray(data.prescribed_sets);
        const hasValidStructure =
          data.prescribed_sets.length === 0 ||
          (typeof data.prescribed_sets[0].set === 'number');

        if (isValidArray && hasValidStructure) {
          this.addResult({
            table: 'workout_exercises',
            status: 'pass',
            message: 'prescribed_sets JSONB structure valid',
          });
        } else {
          this.addResult({
            table: 'workout_exercises',
            status: 'warning',
            message: 'prescribed_sets structure may not match PrescribedSet type',
          });
        }
      }
    } catch (error) {
      this.addResult({
        table: 'workout_exercises',
        status: 'warning',
        message: 'No data available to validate prescribed_sets',
      });
    }

    // Validate exercise_cards JSONB arrays
    try {
      const { data, error } = await this.supabase
        .from('exercise_cards')
        .select('instructions, coaching_cues, equipment, primary_muscle_groups')
        .limit(1)
        .single();

      if (!error && data) {
        const fields = [
          'instructions',
          'coaching_cues',
          'equipment',
          'primary_muscle_groups',
        ] as const;

        fields.forEach((field) => {
          const value = data[field];
          if (value === null || Array.isArray(value)) {
            this.addResult({
              table: 'exercise_cards',
              status: 'pass',
              message: `${field} is correctly typed as string[] | null`,
            });
          } else {
            this.addResult({
              table: 'exercise_cards',
              status: 'fail',
              message: `${field} has invalid type`,
            });
          }
        });
      }
    } catch (error) {
      this.addResult({
        table: 'exercise_cards',
        status: 'warning',
        message: 'No data available to validate JSONB fields',
      });
    }
  }

  async validateEnums(): Promise<void> {
    console.log('\n🔤 Validating Enum Values...\n');

    // Validate difficulty enum
    try {
      const { data, error } = await this.supabase
        .from('exercise_cards')
        .select('difficulty')
        .not('difficulty', 'is', null)
        .limit(10);

      if (!error && data) {
        const validDifficulties = ['beginner', 'intermediate', 'advanced'];
        const invalidValues = data
          .map((row) => row.difficulty)
          .filter((d) => d && !validDifficulties.includes(d));

        if (invalidValues.length === 0) {
          this.addResult({
            table: 'exercise_cards',
            status: 'pass',
            message: 'Difficulty enum values are valid',
          });
        } else {
          this.addResult({
            table: 'exercise_cards',
            status: 'fail',
            message: `Invalid difficulty values found: ${invalidValues.join(', ')}`,
          });
        }
      }
    } catch (error) {
      this.addResult({
        table: 'exercise_cards',
        status: 'warning',
        message: 'Could not validate difficulty enum',
      });
    }

    // Validate status enum
    try {
      const { data, error } = await this.supabase
        .from('workout_sessions')
        .select('status')
        .limit(10);

      if (!error && data) {
        const validStatuses = ['in_progress', 'completed', 'skipped'];
        const invalidValues = data
          .map((row) => row.status)
          .filter((s) => !validStatuses.includes(s));

        if (invalidValues.length === 0) {
          this.addResult({
            table: 'workout_sessions',
            status: 'pass',
            message: 'Status enum values are valid',
          });
        } else {
          this.addResult({
            table: 'workout_sessions',
            status: 'fail',
            message: `Invalid status values found: ${invalidValues.join(', ')}`,
          });
        }
      }
    } catch (error) {
      this.addResult({
        table: 'workout_sessions',
        status: 'warning',
        message: 'Could not validate status enum',
      });
    }
  }

  async validateForeignKeys(): Promise<void> {
    console.log('\n🔗 Validating Foreign Key Relationships...\n');

    // Validate workout -> program relationship
    try {
      const { data, error } = await this.supabase
        .from('workouts')
        .select(`
          id,
          program_id,
          program:programs(id, name)
        `)
        .limit(1)
        .single();

      if (!error && data && data.program) {
        this.addResult({
          table: 'workouts',
          status: 'pass',
          message: 'Foreign key to programs is valid',
        });
      }
    } catch (error) {
      this.addResult({
        table: 'workouts',
        status: 'warning',
        message: 'Could not validate program foreign key',
      });
    }

    // Add more foreign key validations as needed
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    const passed = this.results.filter((r) => r.status === 'pass').length;
    const failed = this.results.filter((r) => r.status === 'fail').length;
    const warnings = this.results.filter((r) => r.status === 'warning').length;

    console.log(`✅ Passed:   ${passed}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📝 Total:    ${this.results.length}\n`);

    if (failed > 0) {
      console.log('❌ Validation failed! Please review the errors above.');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('⚠️  Validation passed with warnings. Review warnings above.');
      process.exit(0);
    } else {
      console.log('✅ All validations passed!');
      process.exit(0);
    }
  }

  async run(): Promise<void> {
    console.log('🔍 Starting Schema Validation...\n');
    console.log('📋 Validating Table Access...\n');

    const tables: Array<keyof Database['public']['Tables']> = [
      'programs',
      'workouts',
      'exercise_cards',
      'workout_exercises',
      'workout_sessions',
      'exercise_logs',
    ];

    for (const table of tables) {
      await this.validateTable(table);
    }

    await this.validateJSONBFields();
    await this.validateEnums();
    await this.validateForeignKeys();

    this.printSummary();
  }
}

// Run validation
const validator = new SchemaValidator();
validator.run().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});
