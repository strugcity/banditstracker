/**
 * Supabase Edge Function: import-to-library
 *
 * Imports selected exercises from a video analysis session to the exercise_cards library.
 * Supports user edits and marks imported exercises with "New" flag.
 *
 * Request body:
 * {
 *   sessionId: string,
 *   exerciseIndices: number[],           // Array of exercise indices to import (0-based)
 *   editedExercises?: Record<number, {   // Optional: user edits by index
 *     name?: string,
 *     instructions?: string[],
 *     coaching_cues?: string[],
 *     equipment?: string[],
 *     difficulty?: string,
 *     start_time?: string,
 *     end_time?: string
 *   }>,
 *   markComplete?: boolean               // Optional: mark session as completed (default: true if all exercises imported)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   inserted: number,
 *   updated: number,
 *   exercises: Array<{ id, name, difficulty, equipment, is_new }>
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

function shouldTrackWeight(name: string): boolean {
  const nameLower = name.toLowerCase()
  const bodyweightKeywords = ['push up', 'pull up', 'bodyweight', 'plank', 'burpee']
  return !bodyweightKeywords.some(keyword => nameLower.includes(keyword))
}

function shouldTrackReps(name: string): boolean {
  const nameLower = name.toLowerCase()
  const durationKeywords = ['plank', 'hold', 'carry', 'run', 'row']
  return !durationKeywords.some(keyword => nameLower.includes(keyword))
}

function shouldTrackDuration(name: string): boolean {
  const nameLower = name.toLowerCase()
  const durationKeywords = ['plank', 'hold', 'carry', 'run', 'row', 'bike']
  return durationKeywords.some(keyword => nameLower.includes(keyword))
}

function shouldTrackDistance(name: string): boolean {
  const nameLower = name.toLowerCase()
  const distanceKeywords = ['run', 'sprint', 'row', 'bike', 'swim']
  return distanceKeywords.some(keyword => nameLower.includes(keyword))
}

async function importExercisesToLibrary(
  supabase: any,
  videoUrl: string,
  exercises: GeminiExercise[],
  sessionId: string,
  ownerId: string | null
): Promise<{ inserted: number; updated: number; exerciseIds: string[]; exercises: any[] }> {
  let inserted = 0
  let updated = 0
  const savedExercises = []
  const exerciseIds = []

  // Calculate new_expires_at (7 days from now for auto-clearing is_new flag)
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const exercise of exercises) {
    // Check if exercise already exists (case-insensitive name match)
    const { data: existing } = await supabase
      .from('exercise_cards')
      .select('id, name')
      .ilike('name', exercise.name)
      .single()

    const exerciseData = {
      name: exercise.name,
      video_url: videoUrl,
      video_start_time: exercise.start_time,
      video_end_time: exercise.end_time,
      instructions: exercise.instructions,
      coaching_cues: exercise.coaching_cues,
      screenshot_timestamps: exercise.screenshot_timestamps,
      difficulty: exercise.difficulty,
      equipment: exercise.equipment,
      exercise_type: inferExerciseType(exercise.name),
      tracks_weight: shouldTrackWeight(exercise.name),
      tracks_reps: shouldTrackReps(exercise.name),
      tracks_duration: shouldTrackDuration(exercise.name),
      tracks_distance: shouldTrackDistance(exercise.name),
      // New fields for staging modal system
      is_new: true,
      new_expires_at: newExpiresAt,
      source_session_id: sessionId,
      owner_id: ownerId,
    }

    if (existing) {
      // Update existing exercise - also set is_new to highlight it was updated
      const { data, error } = await supabase
        .from('exercise_cards')
        .update({
          ...exerciseData,
          // Keep existing owner_id if updating
          owner_id: undefined,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      updated++
      savedExercises.push(data)
      exerciseIds.push(existing.id)
    } else {
      // Insert new exercise
      const { data, error } = await supabase
        .from('exercise_cards')
        .insert(exerciseData)
        .select()
        .single()

      if (error) throw error
      inserted++
      savedExercises.push(data)
      exerciseIds.push(data.id)
    }
  }

  return { inserted, updated, exerciseIds, exercises: savedExercises }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, exerciseIndices, editedExercises, markComplete } = await req.json()

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!exerciseIndices || !Array.isArray(exerciseIndices)) {
      return new Response(
        JSON.stringify({ error: 'exerciseIndices must be an array' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the analysis session
    const { data: session, error: sessionError } = await supabase
      .from('video_analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Allow re-importing from completed sessions (for individual saves)
    // Only block if session was auto-expired
    if (session.status === 'expired' && session.auto_imported) {
      return new Response(
        JSON.stringify({ error: 'Session expired and exercises were auto-imported' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract selected exercises from analysis result and merge with edits
    const allExercises = session.analysis_result.exercises as GeminiExercise[]
    const selectedExercises = exerciseIndices.map((index: number) => {
      const original = allExercises[index]
      if (!original) return undefined

      // Merge with user edits (from request) and session edits (previously saved)
      const sessionEdits = session.edited_exercises?.[index.toString()]
      const requestEdits = editedExercises?.[index]

      // Request edits take priority over session edits
      const mergedEdits = { ...sessionEdits, ...requestEdits }

      return mergeExerciseWithEdits(original, mergedEdits)
    })

    // Validate indices
    if (selectedExercises.some((ex: GeminiExercise | undefined) => ex === undefined)) {
      return new Response(
        JSON.stringify({ error: 'Invalid exercise index' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Importing ${selectedExercises.length} exercises from session ${sessionId}`)

    // Import exercises to library (with is_new flag)
    const result = await importExercisesToLibrary(
      supabase,
      session.video_url,
      selectedExercises as GeminiExercise[],
      sessionId,
      session.owner_id
    )

    // Track which exercises have been imported
    const previouslyImportedIds = session.imported_exercise_ids || []
    const allImportedIds = [...new Set([...previouslyImportedIds, ...result.exerciseIds])]

    // Determine if session should be marked complete
    const totalExercises = allExercises.length
    const shouldComplete = markComplete ?? (allImportedIds.length >= totalExercises)

    // Update session status
    const sessionUpdate: Record<string, any> = {
      imported_exercise_ids: allImportedIds,
      status: shouldComplete ? 'completed' : 'in_progress',
    }

    if (shouldComplete) {
      sessionUpdate.completed_at = new Date().toISOString()
    }

    // Also save any edits to the session for future reference
    if (editedExercises && Object.keys(editedExercises).length > 0) {
      const mergedEdits = { ...session.edited_exercises, ...editedExercises }
      sessionUpdate.edited_exercises = mergedEdits
    }

    await supabase
      .from('video_analysis_sessions')
      .update(sessionUpdate)
      .eq('id', sessionId)

    console.log(`Imported ${result.inserted} new, updated ${result.updated} existing (session ${shouldComplete ? 'completed' : 'in_progress'})`)

    return new Response(
      JSON.stringify({
        success: true,
        inserted: result.inserted,
        updated: result.updated,
        sessionStatus: shouldComplete ? 'completed' : 'in_progress',
        totalImported: allImportedIds.length,
        totalExercises,
        exercises: result.exercises.map(e => ({
          id: e.id,
          name: e.name,
          difficulty: e.difficulty,
          equipment: e.equipment,
          is_new: e.is_new
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in import-to-library function:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
