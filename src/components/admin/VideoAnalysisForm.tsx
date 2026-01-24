/**
 * Video Analysis Form Component
 *
 * Allows users to submit YouTube URLs for AI analysis.
 * Results open in an inline staging modal (no redirect).
 * Enforces session limits (max 3 open sessions).
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStagingSessions } from '@/hooks'
import type { AnalyzeVideoResponse, EdgeFunctionError } from '@/types/staging'

interface VideoAnalysisFormProps {
  /** Called when analysis completes with the session ID */
  onAnalysisComplete: (sessionId: string) => void
  /** Called when an error occurs */
  onError?: (error: string) => void
}

export function VideoAnalysisForm({
  onAnalysisComplete,
  onError,
}: VideoAnalysisFormProps) {
  const { openSessionCount, canCreateNewSession, sessions, refetch } =
    useStagingSessions()

  const [videoUrl, setVideoUrl] = useState('')
  const [sport, setSport] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreateNewSession) {
      const msg = `You have ${openSessionCount} open sessions. Please complete or discard existing sessions before creating new ones.`
      setError(msg)
      onError?.(msg)
      return
    }

    setIsAnalyzing(true)
    setProgress('Validating video URL...')
    setError('')

    try {
      // Validate YouTube URL
      const isValidYouTube =
        /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(
          videoUrl
        )

      if (!isValidYouTube) {
        throw new Error(
          'Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID)'
        )
      }

      // Call analyze-video Edge Function
      setProgress('Analyzing video with AI... This may take a moment.')

      const response = await supabase.functions.invoke<
        AnalyzeVideoResponse | EdgeFunctionError
      >('analyze-video', {
        body: {
          videoUrl,
          sport: sport || undefined,
        },
      })

      const { data, error: functionError } = response

      if (functionError) {
        throw new Error(
          `${functionError.message}. Make sure the analyze-video function is deployed.`
        )
      }

      // Check for session limit error (429)
      if (data && 'error' in data) {
        const errorData = data as EdgeFunctionError
        if (errorData.currentCount !== undefined) {
          // Session limit reached
          throw new Error(
            errorData.message ||
              `You have ${errorData.currentCount} open sessions. Maximum is ${errorData.maxAllowed}.`
          )
        }
        throw new Error(errorData.error || 'Analysis failed')
      }

      const successData = data as AnalyzeVideoResponse

      if (!successData || !successData.success) {
        throw new Error('Invalid response from video analysis service')
      }

      setProgress('Analysis complete! Opening review...')

      // Clear form
      setVideoUrl('')
      setSport('')

      // Refresh session count
      refetch()

      // Notify parent to open staging modal
      onAnalysisComplete(successData.sessionId)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      setProgress('')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Resume existing session
  const handleResumeSession = (sessionId: string) => {
    onAnalysisComplete(sessionId)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Session limit warning */}
      {!canCreateNewSession && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-orange-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-orange-800 font-medium">Session Limit Reached</h3>
              <p className="text-orange-700 text-sm mt-1">
                You have {openSessionCount} open staging sessions (maximum 3).
                Complete or discard existing sessions to analyze new videos.
              </p>
              {sessions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-orange-800">
                    Open sessions:
                  </p>
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleResumeSession(session.id)}
                      className="w-full text-left p-2 bg-white border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 truncate block">
                        {session.video_title || 'Untitled Video'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {session.analysis_result?.exercises?.length || 0} exercises
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Analyze Training Video
        </h2>
        <p className="text-gray-600 mb-6">
          Submit a YouTube URL to automatically extract exercises, instructions,
          and coaching cues using AI.
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
              disabled={isAnalyzing || !canCreateNewSession}
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
              disabled={isAnalyzing || !canCreateNewSession}
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
            disabled={isAnalyzing || !videoUrl || !canCreateNewSession}
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
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          How it works:
        </h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Paste a YouTube URL of a training or exercise demonstration video</li>
          <li>AI analyzes the video and extracts exercises, instructions, and tips</li>
          <li>Review and edit the extracted exercises in the staging area</li>
          <li>Save exercises to your library individually or in batch</li>
        </ol>
      </div>
    </div>
  )
}
