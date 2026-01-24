/**
 * Supabase Edge Function: clear-expired-new-flags
 *
 * Scheduled function that runs daily to clear the "New" flag from exercises
 * that have been in the library for more than 7 days.
 *
 * This function should be called via cron job or pg_cron.
 *
 * What it does:
 * 1. Find exercises where is_new = true AND new_expires_at < NOW()
 * 2. Set is_new = false for those exercises
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date().toISOString()

    // Find exercises with expired "New" flag
    const { data: expiredNewExercises, error: fetchError } = await supabase
      .from('exercise_cards')
      .select('id, name')
      .eq('is_new', true)
      .lt('new_expires_at', now)

    if (fetchError) {
      throw new Error(`Failed to fetch exercises with expired New flags: ${fetchError.message}`)
    }

    if (!expiredNewExercises || expiredNewExercises.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No exercises with expired New flags to clear',
          cleared: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredNewExercises.length} exercises with expired New flags`)

    // Clear the is_new flag for all expired exercises
    const { error: updateError, count } = await supabase
      .from('exercise_cards')
      .update({ is_new: false })
      .eq('is_new', true)
      .lt('new_expires_at', now)

    if (updateError) {
      throw new Error(`Failed to clear New flags: ${updateError.message}`)
    }

    console.log(`Cleared New flag from ${count || expiredNewExercises.length} exercises`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleared New flag from ${count || expiredNewExercises.length} exercises`,
        cleared: count || expiredNewExercises.length,
        exercises: expiredNewExercises.map(e => e.name),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('clear-expired-new-flags error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
