/**
 * Supabase Edge Function: analyze-video
 *
 * Analyzes exercise/training videos using Google Gemini AI and extracts:
 * - Exercise names and timestamps (for multi-exercise videos)
 * - Step-by-step instructions
 * - Coaching cues
 * - Screenshot timestamps for key moments
 * - Metadata (difficulty, equipment, etc.)
 *
 * Usage:
 *   POST /analyze-video
 *   Body: { "videoUrl": "https://youtube.com/...", "sport": "baseball" }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Gemini API Response Types
 */
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

interface GeminiAnalysisResponse {
  video_title: string
  sport?: string
  total_duration: string
  exercises: GeminiExercise[]
}

/**
 * Call Google Gemini API to analyze video
 */
async function analyzeVideoWithGemini(
  videoUrl: string,
  geminiApiKey: string,
  sport?: string
): Promise<GeminiAnalysisResponse> {
  const prompt = buildAnalysisPrompt(sport)

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            fileData: {
              fileUri: videoUrl
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  // Extract JSON from Gemini response
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!jsonText) {
    throw new Error('No content returned from Gemini API')
  }

  // Clean potential markdown code blocks
  const cleanedJson = jsonText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  return JSON.parse(cleanedJson)
}

/**
 * Build analysis prompt for Gemini
 */
function buildAnalysisPrompt(sport?: string): string {
  const sportContext = sport ? `This is a ${sport} training video.` : ''

  return `Analyze this exercise or athletic drill video. Provide a structured analysis.

${sportContext}

TASKS:
1. If the video contains MULTIPLE exercises, segment them with timestamps
2. For EACH exercise provide:
   - Exercise name
   - Start time (MM:SS)
   - End time (MM:SS)
   - Step-by-step instructions (3-5 steps, clear and concise)
   - Key coaching cues (2-3 tips)
   - Screenshot timestamps - identify 2-4 moments that best show proper form
   - Difficulty: beginner, intermediate, or advanced
   - Equipment needed

OUTPUT as valid JSON:
{
  "video_title": "string",
  "sport": "string",
  "total_duration": "MM:SS",
  "exercises": [
    {
      "name": "string",
      "start_time": "MM:SS",
      "end_time": "MM:SS",
      "instructions": ["step 1", "step 2"],
      "coaching_cues": ["cue 1", "cue 2"],
      "screenshot_timestamps": ["MM:SS", "MM:SS"],
      "difficulty": "string",
      "equipment": ["item1"]
    }
  ]
}

Respond ONLY with the JSON, no other text.`
}

/**
 * Insert or update exercise cards in database
 */
async function saveExerciseCards(
  supabase: any,
  videoUrl: string,
  analysis: GeminiAnalysisResponse
): Promise<{ inserted: number; updated: number; exercises: any[] }> {
  let inserted = 0
  let updated = 0
  const savedExercises = []

  for (const exercise of analysis.exercises) {
    // Check if exercise already exists
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
    }
  }

  return { inserted, updated, exercises: savedExercises }
}

/**
 * Infer exercise type from name
 */
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

  return 'strength' // default
}

/**
 * Determine if exercise should track weight
 */
function shouldTrackWeight(name: string): boolean {
  const nameLower = name.toLowerCase()
  const bodyweightKeywords = ['push up', 'pull up', 'bodyweight', 'plank', 'burpee']

  return !bodyweightKeywords.some(keyword => nameLower.includes(keyword))
}

/**
 * Determine if exercise should track reps
 */
function shouldTrackReps(name: string): boolean {
  const nameLower = name.toLowerCase()
  const durationKeywords = ['plank', 'hold', 'carry', 'run', 'row']

  return !durationKeywords.some(keyword => nameLower.includes(keyword))
}

/**
 * Determine if exercise should track duration
 */
function shouldTrackDuration(name: string): boolean {
  const nameLower = name.toLowerCase()
  const durationKeywords = ['plank', 'hold', 'carry', 'run', 'row', 'bike']

  return durationKeywords.some(keyword => nameLower.includes(keyword))
}

/**
 * Determine if exercise should track distance
 */
function shouldTrackDistance(name: string): boolean {
  const nameLower = name.toLowerCase()
  const distanceKeywords = ['run', 'sprint', 'row', 'bike', 'swim']

  return distanceKeywords.some(keyword => nameLower.includes(keyword))
}

/**
 * Extract user ID from authorization header
 */
async function getUserFromAuthHeader(
  supabase: any,
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')

  // Use the token to get the user
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    console.log('Could not extract user from auth header:', error?.message)
    return null
  }

  return user.id
}

/**
 * Check if user has reached session limit (max 3 open sessions)
 */
async function checkSessionLimit(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; currentCount: number }> {
  const { count, error } = await supabase
    .from('video_analysis_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .in('status', ['pending', 'in_progress'])
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error checking session limit:', error)
    // Allow on error to not block users
    return { allowed: true, currentCount: 0 }
  }

  const currentCount = count || 0
  return {
    allowed: currentCount < 3,
    currentCount
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { videoUrl, sport } = await req.json()

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'videoUrl is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate YouTube URL
    const isYouTube = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(videoUrl)
    if (!isYouTube) {
      return new Response(
        JSON.stringify({
          error: 'Only YouTube URLs are currently supported',
          hint: 'Format: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get API keys from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured in Edge Function secrets')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Initialize Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract user ID from auth header (for session ownership)
    const authHeader = req.headers.get('Authorization')
    const userId = await getUserFromAuthHeader(supabase, authHeader)

    // Check session limit if user is authenticated
    if (userId) {
      const { allowed, currentCount } = await checkSessionLimit(supabase, userId)
      if (!allowed) {
        return new Response(
          JSON.stringify({
            error: 'Session limit reached',
            message: `You have ${currentCount} open staging sessions. Maximum allowed is 3.`,
            hint: 'Complete or discard existing sessions before creating new ones.',
            currentCount,
            maxAllowed: 3
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Step 1: Analyze video with Gemini
    console.log(`Analyzing video: ${videoUrl}`)
    const analysis = await analyzeVideoWithGemini(videoUrl, geminiApiKey, sport)
    console.log(`Found ${analysis.exercises.length} exercises`)

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Step 2: Save to staging (video_analysis_sessions) with owner and expiry
    console.log('Saving analysis to staging...')
    const { data: session, error: sessionError } = await supabase
      .from('video_analysis_sessions')
      .insert({
        video_url: videoUrl,
        video_title: analysis.video_title,
        sport: analysis.sport || sport,
        total_duration: analysis.total_duration,
        analysis_result: analysis,
        status: 'pending',
        owner_id: userId,
        expires_at: expiresAt,
        edited_exercises: {}
      })
      .select()
      .single()

    if (sessionError) throw sessionError
    if (!session) throw new Error('Failed to create analysis session')

    console.log(`Created staging session: ${session.id} (owner: ${userId || 'anonymous'}, expires: ${expiresAt})`)

    // Return success response with sessionId and expiry info
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        expiresAt: session.expires_at,
        analysis: {
          video_title: analysis.video_title,
          sport: analysis.sport,
          total_duration: analysis.total_duration,
          exercise_count: analysis.exercises.length
        },
        exercises: analysis.exercises.map(e => ({
          name: e.name,
          difficulty: e.difficulty,
          equipment: e.equipment,
          start_time: e.start_time,
          end_time: e.end_time
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in analyze-video function:', error)

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
