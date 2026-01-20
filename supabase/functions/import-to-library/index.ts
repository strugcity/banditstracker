/**
 * Supabase Edge Function: import-to-library
 *
 * Imports selected exercises from a video analysis session to the exercise_cards library.
 *
 * Request body:
 * {
 *   sessionId: string,
 *   exerciseIndices: number[]  // Array of exercise indices to import (0-based)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   inserted: number,
 *   updated: number,
 *   exercises: Array<{ id, name, difficulty, equipment }>
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
  exercises: GeminiExercise[]
): Promise<{ inserted: number; updated: number; exerciseIds: string[]; exercises: any[] }> {
  let inserted = 0
  let updated = 0
  const savedExercises = []
  const exerciseIds = []

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
    }

    if (existing) {
      // Update existing exercise
      const { data, error } = await supabase
        .from('exercise_cards')
        .update(exerciseData)
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
    const { sessionId, exerciseIndices } = await req.json()

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

    if (session.status === 'imported') {
      return new Response(
        JSON.stringify({ error: 'Session already imported' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract selected exercises from analysis result
    const allExercises = session.analysis_result.exercises
    const selectedExercises = exerciseIndices.map(index => allExercises[index])

    // Validate indices
    if (selectedExercises.some(ex => ex === undefined)) {
      return new Response(
        JSON.stringify({ error: 'Invalid exercise index' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Importing ${selectedExercises.length} exercises from session ${sessionId}`)

    // Import exercises to library
    const result = await importExercisesToLibrary(
      supabase,
      session.video_url,
      selectedExercises
    )

    // Update session status
    await supabase
      .from('video_analysis_sessions')
      .update({
        status: 'imported',
        imported_at: new Date().toISOString(),
        imported_exercise_ids: result.exerciseIds
      })
      .eq('id', sessionId)

    console.log(`Imported ${result.inserted} new, updated ${result.updated} existing`)

    return new Response(
      JSON.stringify({
        success: true,
        inserted: result.inserted,
        updated: result.updated,
        exercises: result.exercises.map(e => ({
          id: e.id,
          name: e.name,
          difficulty: e.difficulty,
          equipment: e.equipment
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
