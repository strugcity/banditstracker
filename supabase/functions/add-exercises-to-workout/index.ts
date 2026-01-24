/**
 * Supabase Edge Function: add-exercises-to-workout
 *
 * Imports selected exercises from a video analysis session to the exercise library
 * and adds them to a specified workout.
 *
 * Request body:
 * {
 *   sessionId: string,
 *   exerciseIndices: number[],           // Array of exercise indices to import (0-based)
 *   workoutId: string,                   // Workout to add exercises to
 *   editedExercises?: Record<number, {   // Optional: user edits by index
 *     name?: string,
 *     instructions?: string[],
 *     coaching_cues?: string[],
 *     equipment?: string[],
 *     difficulty?: string,
 *     start_time?: string,
 *     end_time?: string
 *   }>
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   added: number,
 *   exerciseIds: string[],
 *   workoutExerciseIds: string[]
 * }
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

interface ExerciseEdit {
  name?: string
  instructions?: string[]
  coaching_cues?: string[]
  equipment?: string[]
  difficulty?: string
  start_time?: string
  end_time?: string
  screenshot_timestamps?: string[]
}

/**
 * Merge original exercise with user edits
 */
function mergeExerciseWithEdits(original: GeminiExercise, edits?: ExerciseEdit): GeminiExercise {
  if (!edits) return original

  return {
    name: edits.name ?? original.name,
    start_time: edits.start_time ?? original.start_time,
    end_time: edits.end_time ?? original.end_time,
    instructions: edits.instructions ?? original.instructions,
    coaching_cues: edits.coaching_cues ?? original.coaching_cues,
    screenshot_timestamps: edits.screenshot_timestamps ?? original.screenshot_timestamps,
    difficulty: (edits.difficulty as GeminiExercise['difficulty']) ?? original.difficulty,
    equipment: edits.equipment ?? original.equipment,
  }
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
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { sessionId, exerciseIndices, workoutId, editedExercises } = await req.json()

    if (!sessionId || !exerciseIndices || !Array.isArray(exerciseIndices) || exerciseIndices.length === 0) {
      return new Response(
        JSON.stringify({ error: 'sessionId and exerciseIndices are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!workoutId) {
      return new Response(
        JSON.stringify({ error: 'workoutId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from('video_analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found', details: sessionError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify workout exists and get program info
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id, name, program_id')
      .eq('id', workoutId)
      .single()

    if (workoutError || !workout) {
      return new Response(
        JSON.stringify({ error: 'Workout not found', details: workoutError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const analysisResult = session.analysis_result
    if (!analysisResult || !analysisResult.exercises || !Array.isArray(analysisResult.exercises)) {
      return new Response(
        JSON.stringify({ error: 'Invalid session: no exercises found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current max exercise_order for the workout
    const { data: existingExercises, error: orderError } = await supabase
      .from('workout_exercises')
      .select('exercise_order')
      .eq('workout_id', workoutId)
      .order('exercise_order', { ascending: false })
      .limit(1)

    let nextOrder = 1
    if (existingExercises && existingExercises.length > 0) {
      nextOrder = (existingExercises[0].exercise_order || 0) + 1
    }

    // Calculate 7 days from now for new_expires_at
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    // Process selected exercises
    const exerciseIds: string[] = []
    const workoutExerciseIds: string[] = []
    let addedCount = 0

    for (const index of exerciseIndices) {
      if (index < 0 || index >= analysisResult.exercises.length) {
        console.warn(`Invalid exercise index: ${index}`)
        continue
      }

      const originalExercise = analysisResult.exercises[index] as GeminiExercise
      const userEdits = editedExercises?.[index]
      const exercise = mergeExerciseWithEdits(originalExercise, userEdits)

      // Check if exercise with this name already exists
      const { data: existing } = await supabase
        .from('exercise_cards')
        .select('id')
        .eq('name', exercise.name)
        .limit(1)

      let exerciseId: string

      if (existing && existing.length > 0) {
        // Update existing exercise
        exerciseId = existing[0].id
        await supabase
          .from('exercise_cards')
          .update({
            video_url: session.video_url,
            video_start_time: exercise.start_time,
            video_end_time: exercise.end_time,
            instructions: exercise.instructions,
            coaching_cues: exercise.coaching_cues,
            screenshot_timestamps: exercise.screenshot_timestamps,
            difficulty: exercise.difficulty,
            equipment: exercise.equipment,
            exercise_type: inferExerciseType(exercise.name),
            updated_at: new Date().toISOString(),
          })
          .eq('id', exerciseId)
      } else {
        // Create new exercise with is_new flag
        const { data: newExercise, error: insertError } = await supabase
          .from('exercise_cards')
          .insert({
            name: exercise.name,
            video_url: session.video_url,
            video_start_time: exercise.start_time,
            video_end_time: exercise.end_time,
            instructions: exercise.instructions,
            coaching_cues: exercise.coaching_cues,
            screenshot_timestamps: exercise.screenshot_timestamps,
            difficulty: exercise.difficulty,
            equipment: exercise.equipment,
            exercise_type: inferExerciseType(exercise.name),
            is_global: true,
            is_new: true,
            new_expires_at: newExpiresAt.toISOString(),
            source_session_id: sessionId,
          })
          .select('id')
          .single()

        if (insertError) {
          console.error(`Failed to insert exercise ${exercise.name}:`, insertError)
          continue
        }

        exerciseId = newExercise.id
      }

      exerciseIds.push(exerciseId)

      // Check if exercise is already in this workout
      const { data: existingWorkoutExercise } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq('workout_id', workoutId)
        .eq('exercise_card_id', exerciseId)
        .limit(1)

      if (!existingWorkoutExercise || existingWorkoutExercise.length === 0) {
        // Add to workout
        const { data: workoutExercise, error: weError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutId,
            exercise_card_id: exerciseId,
            exercise_order: nextOrder,
            prescribed_sets: [
              { set_number: 1, target_reps: 10, target_weight: null, target_rpe: null }
            ],
            notes: `Imported from video: ${session.video_title || 'Unknown'}`,
          })
          .select('id')
          .single()

        if (weError) {
          console.error(`Failed to add exercise to workout:`, weError)
        } else {
          workoutExerciseIds.push(workoutExercise.id)
          nextOrder++
          addedCount++
        }
      }
    }

    // Update session status if needed
    await supabase
      .from('video_analysis_sessions')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    return new Response(
      JSON.stringify({
        success: true,
        added: addedCount,
        exerciseIds,
        workoutExerciseIds,
        workoutId,
        workoutName: workout.name,
        programId: workout.program_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('add-exercises-to-workout error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
