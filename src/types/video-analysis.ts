/**
 * Type definitions for video analysis service
 */

/**
 * Request payload for analyze-video Edge Function
 */
export interface AnalyzeVideoRequest {
  videoUrl: string
  sport?: string
}

/**
 * Response from analyze-video Edge Function
 */
export interface AnalyzeVideoResponse {
  success: boolean
  analysis: {
    video_title: string
    sport?: string
    total_duration: string
    exercise_count: number
  }
  database: {
    inserted: number
    updated: number
    exercises: Array<{
      id: string
      name: string
      difficulty: string
      equipment: string[]
    }>
  }
}

/**
 * Request payload for extract-frames Edge Function
 */
export interface ExtractFramesRequest {
  videoUrl: string
  timestamps: string[]
  exerciseId: string
  method?: 'thumbnail' | 'shotstack'
}

/**
 * Response from extract-frames Edge Function
 */
export interface ExtractFramesResponse {
  success: boolean
  screenshot_urls: string[]
  method: string
}

/**
 * Error response from Edge Functions
 */
export interface EdgeFunctionError {
  error: string
  details?: string
  hint?: string
}

/**
 * Exercise card with video analysis data
 */
export interface ExerciseCardWithVideo {
  id: string
  name: string
  short_name: string | null
  video_url: string | null
  video_start_time: string | null
  video_end_time: string | null
  instructions: string[] | null
  coaching_cues: string[] | null
  screenshot_timestamps: string[] | null
  screenshot_urls: string[] | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  equipment: string[] | null
  exercise_type: string | null
  tracks_weight: boolean
  tracks_reps: boolean
  tracks_duration: boolean
  tracks_distance: boolean
  default_rest_seconds: number
  created_at: string
  updated_at: string
}

/**
 * Video analysis job status
 */
export interface VideoAnalysisJob {
  id: string
  video_url: string
  sport?: string
  status: 'pending' | 'analyzing' | 'extracting_frames' | 'completed' | 'failed'
  error?: string
  created_at: string
  completed_at?: string
  exercise_ids?: string[]
}
