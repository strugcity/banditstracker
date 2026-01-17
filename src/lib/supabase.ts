/**
 * Supabase Client Configuration
 *
 * This file exports a pre-configured Supabase client with full TypeScript support.
 * Import this client throughout your application for type-safe database operations.
 *
 * @example
 * import { supabase } from '@/lib/supabase'
 *
 * const { data } = await supabase.from('programs').select('*')
 * // data is automatically typed as Program[] | null
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please add it to your .env file. ' +
    'See .env.example for reference.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to your .env file. ' +
    'See .env.example for reference.'
  );
}

/**
 * Pre-configured Supabase client with TypeScript support
 *
 * Features:
 * - Full type inference for all database operations
 * - Automatic type checking for inserts, updates, and queries
 * - Type-safe foreign key relationships
 * - JSONB field typing
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to check if Supabase is properly configured
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('programs').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}
