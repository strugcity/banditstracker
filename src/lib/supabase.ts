/**
 * Supabase Client Configuration
 *
 * Configured client for the Bandits Training Tracker application.
 * Provides a typed singleton instance for all database operations.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  )
}

/**
 * Typed Supabase client instance
 *
 * This singleton instance is configured with the Database types for full TypeScript support.
 * Use this client for all database operations throughout the application.
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase'
 *
 * const { data, error } = await supabase
 *   .from('programs')
 *   .select('*')
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
