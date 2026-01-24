/**
 * Supabase Edge Function: process-expired-sessions
 *
 * Scheduled function that runs hourly to process expired video analysis sessions.
 * When a session expires (24 hours after creation), any unsaved exercises are
 * automatically imported to the library with the "New" flag.
 *
 * This function should be called via cron job or pg_cron.
 *
 * What it does:
 * 1. Find sessions where expires_at < NOW() and status IN ('pending', 'in_progress')
 * 2. Auto-import all exercises with is_new = true
 * 3. Update session status to 'expired' and set auto_imported = true
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeminiExercise {
  name: string
  start_time: string
  end_time: string
  instructions: string[]
  coaching_cues: string[]
  screenshot_timestamps: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  equipment: string[]
}

function inferExerciseType(name: string): string {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('squat') || nameLower.includes('deadlift') || nameLower.includes('press')) {
    return 'strength'
  }
  if (nameLower.includes('run') || nameLower.includes('sprint') || nameLower.includes('jog')) {
    return 'cardio'
  }
  if (nameLower.includes('stretch') || nameLower.includes('mobility') || nameLower.includes('yoga')) {
    return 'mobility'
  }
  if (nameLower.includes('plyo') || nameLower.includes('jump') || nameLower.includes('box')) {
    return 'plyometric'
  }
  if (nameLower.includes('throw') || nameLower.includes('medicine ball') || nameLower.includes('slam')) {
    return 'power'
  }

  return 'strength'
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

    // Find expired sessions that haven't been processed yet
    const now = new Date().toISOString()
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('video_analysis_sessions')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .lt('expires_at', now)

    if (fetchError) {
      throw new Error(`Failed to fetch expired sessions: ${fetchError.message}`)
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired sessions to process',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredSessions.length} expired sessions to process`)

    // Calculate 7 days from now for new_expires_at
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    let totalProcessed = 0
    let totalExercisesImported = 0

    for (const session of expiredSessions) {
      try {
        const analysisResult = session.analysis_result
        if (!analysisResult || !analysisResult.exercises || !Array.isArray(analysisResult.exercises)) {
          console.warn(`Session ${session.id} has no valid exercises, skipping`)
          continue
        }

        const importedExerciseIds: string[] = []

        // Import each exercise
        for (let i = 0; i < analysisResult.exercises.length; i++) {
          const exercise = analysisResult.exercises[i] as GeminiExercise

          // Apply any user edits that were saved
          const userEdits = session.edited_exercises?.[i.toString()]
          const finalExercise = {
            name: userEdits?.name ?? exercise.name,
            start_time: userEdits?.start_time ?? exercise.start_time,
            end_time: userEdits?.end_time ?? exercise.end_time,
            instructions: userEdits?.instructions ?? exercise.instructions,
            coaching_cues: userEdits?.coaching_cues ?? exercise.coaching_cues,
            screenshot_timestamps: userEdits?.screenshot_timestamps ?? exercise.screenshot_timestamps,
            difficulty: userEdits?.difficulty ?? exercise.difficulty,
            equipment: userEdits?.equipment ?? exercise.equipment,
          }

          // Check if already exists
          const { data: existing } = await supabase
            .from('exercise_cards')
            .select('id')
            .eq('name', finalExercise.name)
            .limit(1)

          let exerciseId: string

          if (existing && existing.length > 0) {
            exerciseId = existing[0].id
            // Update existing
            await supabase
              .from('exercise_cards')
              .update({
                video_url: session.video_url,
                video_start_time: finalExercise.start_time,
                video_end_time: finalExercise.end_time,
                instructions: finalExercise.instructions,
                coaching_cues: finalExercise.coaching_cues,
                screenshot_timestamps: finalExercise.screenshot_timestamps,
                difficulty: finalExercise.difficulty,
                equipment: finalExercise.equipment,
                exercise_type: inferExerciseType(finalExercise.name),
                updated_at: new Date().toISOString(),
              })
              .eq('id', exerciseId)
          } else {
            // Create new with is_new flag
            const { data: newExercise, error: insertError } = await supabase
              .from('exercise_cards')
              .insert({
                name: finalExercise.name,
                video_url: session.video_url,
                video_start_time: finalExercise.start_time,
                video_end_time: finalExercise.end_time,
                instructions: finalExercise.instructions,
                coaching_cues: finalExercise.coaching_cues,
                screenshot_timestamps: finalExercise.screenshot_timestamps,
                difficulty: finalExercise.difficulty,
                equipment: finalExercise.equipment,
                exercise_type: inferExerciseType(finalExercise.name),
                is_global: true,
                is_new: true,
                new_expires_at: newExpiresAt.toISOString(),
                source_session_id: session.id,
              })
              .select('id')
              .single()

            if (insertError) {
              console.error(`Failed to import exercise ${finalExercise.name}:`, insertError)
              continue
            }

            exerciseId = newExercise.id
          }

          importedExerciseIds.push(exerciseId)
          totalExercisesImported++
        }

        // Update session status
        await supabase
          .from('video_analysis_sessions')
          .update({
            status: 'expired',
            auto_imported: true,
            imported_exercise_ids: importedExerciseIds,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id)

        totalProcessed++
        console.log(`Processed session ${session.id}: imported ${importedExerciseIds.length} exercises`)

      } catch (sessionError) {
        console.error(`Error processing session ${session.id}:`, sessionError)
        // Continue with next session
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${totalProcessed} expired sessions`,
        processed: totalProcessed,
        exercisesImported: totalExercisesImported,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('process-expired-sessions error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
