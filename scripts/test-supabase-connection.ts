#!/usr/bin/env tsx
/**
 * Test Supabase Connection Script
 *
 * This script verifies that your Supabase credentials are correctly configured
 * and that you can connect to your database.
 *
 * Usage:
 *   npm run test-connection
 *   or
 *   npx tsx scripts/test-supabase-connection.ts
 */

/* eslint-disable no-console */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/types';

// Load environment variables from .env file
config();

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bold}${msg}${colors.reset}\n`),
};

interface TestResult {
  passed: boolean;
  message: string;
}

async function runTests(): Promise<void> {
  log.title('🔍 Supabase Connection Test');

  // Test 1: Check environment variables
  log.info('Checking environment variables...');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    log.error('VITE_SUPABASE_URL is not set');
    log.info('Add it to your .env file. See .env.example for reference.');
    process.exit(1);
  }
  log.success(`VITE_SUPABASE_URL is set: ${supabaseUrl.substring(0, 30)}...`);

  if (!supabaseKey) {
    log.error('VITE_SUPABASE_ANON_KEY is not set');
    log.info('Add it to your .env file. See .env.example for reference.');
    process.exit(1);
  }
  log.success('VITE_SUPABASE_ANON_KEY is set');

  // Test 2: Create Supabase client
  log.info('\nCreating Supabase client...');
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  log.success('Supabase client created successfully');

  // Test 3: Test database connection
  log.info('\nTesting database connection...');
  const results: TestResult[] = [];

  // Test programs table
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('count')
      .limit(1);

    if (error) {
      results.push({
        passed: false,
        message: `programs table: ${error.message}`,
      });
    } else {
      results.push({
        passed: true,
        message: 'programs table accessible',
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `programs table: ${error}`,
    });
  }

  // Test workouts table
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('count')
      .limit(1);

    if (error) {
      results.push({
        passed: false,
        message: `workouts table: ${error.message}`,
      });
    } else {
      results.push({
        passed: true,
        message: 'workouts table accessible',
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `workouts table: ${error}`,
    });
  }

  // Test exercise_cards table
  try {
    const { data, error } = await supabase
      .from('exercise_cards')
      .select('count')
      .limit(1);

    if (error) {
      results.push({
        passed: false,
        message: `exercise_cards table: ${error.message}`,
      });
    } else {
      results.push({
        passed: true,
        message: 'exercise_cards table accessible',
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `exercise_cards table: ${error}`,
    });
  }

  // Test workout_exercises table
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('count')
      .limit(1);

    if (error) {
      results.push({
        passed: false,
        message: `workout_exercises table: ${error.message}`,
      });
    } else {
      results.push({
        passed: true,
        message: 'workout_exercises table accessible',
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `workout_exercises table: ${error}`,
    });
  }

  // Test workout_sessions table
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('count')
      .limit(1);

    if (error) {
      results.push({
        passed: false,
        message: `workout_sessions table: ${error.message}`,
      });
    } else {
      results.push({
        passed: true,
        message: 'workout_sessions table accessible',
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `workout_sessions table: ${error}`,
    });
  }

  // Test exercise_logs table
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('count')
      .limit(1);

    if (error) {
      results.push({
        passed: false,
        message: `exercise_logs table: ${error.message}`,
      });
    } else {
      results.push({
        passed: true,
        message: 'exercise_logs table accessible',
      });
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `exercise_logs table: ${error}`,
    });
  }

  // Display results
  log.title('📊 Test Results');
  results.forEach((result) => {
    if (result.passed) {
      log.success(result.message);
    } else {
      log.error(result.message);
    }
  });

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  log.title('📈 Summary');
  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    log.title('🎉 All tests passed! Your Supabase connection is working correctly.');
    process.exit(0);
  } else {
    log.title('❌ Some tests failed. Please check your Supabase configuration.');
    log.info('\nTroubleshooting tips:');
    log.info('1. Verify your Supabase URL and anon key are correct');
    log.info('2. Check that your database schema has been applied');
    log.info('3. Ensure RLS policies allow anonymous access (if needed)');
    log.info('4. Run migrations: npm run db:migrate (if configured)');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log.error('Test script failed:');
  console.error(error);
  process.exit(1);
});
