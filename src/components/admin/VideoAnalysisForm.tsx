/**
 * Video Analysis Form Component
 *
 * Allows admins/coaches to submit YouTube URLs for AI analysis.
 * Results are saved to staging for review before importing to library.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface AnalyzeVideoResponse {
  success: boolean
  sessionId: string
  analysis: {
    video_title: string
    sport?: string
    total_duration: string
    exercise_count: number
  }
  exercises: Array<{
    name: string
    difficulty: string
    equipment: string[]
    start_time: string
    end_time: string
  }>
}

interface VideoAnalysisFormProps {
  onSuccess?: (sessionId: string) => void
  onError?: (error: string) => void
}

export function VideoAnalysisForm({ onSuccess, onError }: VideoAnalysisFormProps) {
  const navigate = useNavigate()
  const [videoUrl, setVideoUrl] = useState('')
  const [sport, setSport] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [result, setResult] = useState<AnalyzeVideoResponse | null>(null)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setProgress('Validating video URL...')
    setError('')
    setResult(null)

    try {
      // Validate YouTube URL
      const isValidYouTube = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(
        videoUrl
      )

      if (!isValidYouTube) {
        throw new Error(
          'Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID)'
        )
      }

      // Call analyze-video Edge Function
      setProgress('Analyzing video with AI...')

      // Try the function - it might be named 'analyze-video' or have a slug like 'bright-action'
      let response = await supabase.functions.invoke<AnalyzeVideoResponse>('analyze-video', {
        body: {
          videoUrl,
          sport: sport || undefined
        }
      })

      // If that fails, try with the slug name
      if (response.error) {
        console.log('Trying with bright-action slug...')
        response = await supabase.functions.invoke<AnalyzeVideoResponse>('bright-action', {
          body: {
            videoUrl,
            sport: sport || undefined
          }
        })
      }

      const { data, error: functionError } = response

      if (functionError) {
        throw new Error(`${functionError.message}. Make sure the analyze-video function is deployed.`)
      }

      if (!data || !data.success) {
        throw new Error('Invalid response from video analysis service')
      }

      setProgress('Analysis complete! Redirecting to review...')
      setResult(data)

      // Call onSuccess callback if provided
      onSuccess?.(data.sessionId)

      // Navigate to review page after short delay
      setTimeout(() => {
        navigate(`/admin/video-review/${data.sessionId}`)
      }, 1000)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      setProgress('')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Analyze Training Video
        </h2>
        <p className="text-gray-600 mb-6">
          Submit a YouTube URL to automatically extract exercises, instructions, and coaching
          cues using AI.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video URL Input */}
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              YouTube URL *
            </label>
            <input
              type="url"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              disabled={isAnalyzing}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Sport Input */}
          <div>
            <label
              htmlFor="sport"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sport (optional)
            </label>
            <select
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              disabled={isAnalyzing}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Auto-detect</option>
              <option value="baseball">Baseball</option>
              <option value="basketball">Basketball</option>
              <option value="football">Football</option>
              <option value="soccer">Soccer</option>
              <option value="general">General Fitness</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAnalyzing || !videoUrl}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
          </button>
        </form>

        {/* Progress Indicator */}
        {progress && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              {isAnalyzing && (
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span className="text-blue-800 font-medium">{progress}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">Analysis Failed</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-green-800 font-medium mb-2">Analysis Complete!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Video:</strong> {result.analysis.video_title}
                  </p>
                  {result.analysis.sport && (
                    <p>
                      <strong>Sport:</strong> {result.analysis.sport}
                    </p>
                  )}
                  <p>
                    <strong>Duration:</strong> {result.analysis.total_duration}
                  </p>
                  <p>
                    <strong>Exercises Found:</strong> {result.analysis.exercise_count}
                  </p>
                </div>

                {/* Exercise List */}
                {result.exercises.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <h4 className="text-green-800 font-medium text-sm mb-2">
                      Exercises Extracted:
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {result.exercises.map((exercise, index) => (
                        <li key={index} className="text-green-700">
                          • {exercise.name}{' '}
                          <span className="text-green-600">
                            ({exercise.difficulty})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-3 text-sm text-green-700">
                  Redirecting to review page...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Paste a YouTube URL of a training or exercise demonstration video</li>
          <li>AI analyzes the video and extracts exercises, instructions, and tips</li>
          <li>Review the extracted exercises and select which ones to import</li>
          <li>Import exercises to your library to use in workout programs</li>
        </ol>
      </div>
    </div>
  )
}
