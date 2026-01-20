/**
 * Video Analysis Service
 *
 * Service layer for interacting with video analysis Edge Functions
 */

import { supabase } from '@/lib/supabase'
import type {
  AnalyzeVideoRequest,
  AnalyzeVideoResponse,
  ExtractFramesRequest,
  ExtractFramesResponse,
  EdgeFunctionError,
  ExerciseCardWithVideo
} from '@/types/video-analysis'

/**
 * Analyze a video URL and populate exercise library
 */
export async function analyzeVideo(
  videoUrl: string,
  sport?: string
): Promise<AnalyzeVideoResponse> {
  const { data, error } = await supabase.functions.invoke<
    AnalyzeVideoResponse | EdgeFunctionError
  >('analyze-video', {
    body: {
      videoUrl,
      sport
    } as AnalyzeVideoRequest
  })

  if (error) {
    throw new Error(`Video analysis failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No response from video analysis service')
  }

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data
}

/**
 * Extract frames from video at specific timestamps
 */
export async function extractFrames(
  videoUrl: string,
  timestamps: string[],
  exerciseId: string,
  method: 'thumbnail' | 'shotstack' = 'thumbnail'
): Promise<ExtractFramesResponse> {
  const { data, error } = await supabase.functions.invoke<
    ExtractFramesResponse | EdgeFunctionError
  >('extract-frames', {
    body: {
      videoUrl,
      timestamps,
      exerciseId,
      method
    } as ExtractFramesRequest
  })

  if (error) {
    throw new Error(`Frame extraction failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No response from frame extraction service')
  }

  if ('error' in data) {
    throw new Error(data.error)
  }

  return data
}

/**
 * Complete workflow: Analyze video + extract frames
 */
export async function analyzeAndExtractFrames(
  videoUrl: string,
  sport?: string,
  extractionMethod: 'thumbnail' | 'shotstack' = 'thumbnail'
): Promise<{
  analysis: AnalyzeVideoResponse
  frames: Record<string, string[]> // exerciseId -> image URLs
}> {
  // Step 1: Analyze video
  const analysis = await analyzeVideo(videoUrl, sport)

  // Step 2: Extract frames for each exercise
  const frames: Record<string, string[]> = {}

  for (const exercise of analysis.database.exercises) {
    // Get the exercise details to find screenshot timestamps
    const { data: exerciseCard, error } = await supabase
      .from('exercise_cards')
      .select('screenshot_timestamps')
      .eq('id', exercise.id)
      .single()

    if (error || !exerciseCard?.screenshot_timestamps) {
      console.warn(`No timestamps found for exercise ${exercise.name}`)
      continue
    }

    try {
      const result = await extractFrames(
        videoUrl,
        exerciseCard.screenshot_timestamps as string[],
        exercise.id,
        extractionMethod
      )

      frames[exercise.id] = result.screenshot_urls
    } catch (err) {
      console.error(`Failed to extract frames for ${exercise.name}:`, err)
    }
  }

  return { analysis, frames }
}

/**
 * Fetch exercise cards with video analysis data
 */
export async function getExerciseCardsWithVideo(
  filters?: {
    sport?: string
    difficulty?: string
    hasVideo?: boolean
  }
): Promise<ExerciseCardWithVideo[]> {
  let query = supabase
    .from('exercise_cards')
    .select('*')
    .order('name')

  if (filters?.hasVideo) {
    query = query.not('video_url', 'is', null)
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch exercise cards: ${error.message}`)
  }

  return data as ExerciseCardWithVideo[]
}

/**
 * Search exercise cards by name or keywords
 */
export async function searchExercises(
  searchTerm: string,
  filters?: {
    sport?: string
    difficulty?: string
    hasVideo?: boolean
  }
): Promise<ExerciseCardWithVideo[]> {
  let query = supabase
    .from('exercise_cards')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%`)
    .order('name')
    .limit(20)

  if (filters?.hasVideo) {
    query = query.not('video_url', 'is', null)
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }

  return data as ExerciseCardWithVideo[]
}

/**
 * Get a single exercise card by ID
 */
export async function getExerciseCard(id: string): Promise<ExerciseCardWithVideo | null> {
  const { data, error } = await supabase
    .from('exercise_cards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch exercise card: ${error.message}`)
  }

  return data as ExerciseCardWithVideo
}

/**
 * Update exercise card video data manually
 */
export async function updateExerciseVideo(
  exerciseId: string,
  updates: {
    video_url?: string
    video_start_time?: string
    video_end_time?: string
    instructions?: string[]
    coaching_cues?: string[]
    screenshot_timestamps?: string[]
    screenshot_urls?: string[]
  }
): Promise<ExerciseCardWithVideo> {
  const { data, error } = await supabase
    .from('exercise_cards')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`)
  }

  return data as ExerciseCardWithVideo
}

/**
 * Validate YouTube URL format
 */
export function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/
  ]
  return patterns.some(pattern => pattern.test(url))
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  return match ? match[1] : null
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoUrl: string,
  quality: 'default' | 'hq' | 'mq' | 'sd' = 'hq'
): string | null {
  const videoId = extractYouTubeVideoId(videoUrl)
  if (!videoId) return null

  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`
}
