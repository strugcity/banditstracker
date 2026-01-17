/**
 * Exercise Card Modal Component
 *
 * Displays detailed exercise information in a modal overlay
 * Features:
 * - Video demonstration player
 * - Step-by-step instructions
 * - Coaching cues and tips
 * - Exercise metadata (difficulty, equipment, muscles)
 * - Mobile-optimized bottom sheet design
 * - Accessible keyboard navigation
 */

import { useEffect } from 'react'
import type { ExerciseCard } from '@/lib/types'
import { Button, Badge } from '@/components/common'

interface ExerciseCardModalProps {
  exerciseCard: ExerciseCard
  isOpen: boolean
  onClose: () => void
}

export function ExerciseCardModal({
  exerciseCard,
  isOpen,
  onClose,
}: ExerciseCardModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const videoId = extractYouTubeVideoId(exerciseCard.video_url)
  const startSeconds = timeToSeconds(exerciseCard.video_start_time)
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}${startSeconds ? `?start=${startSeconds}` : ''}`
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-start justify-between mb-3">
            <h2
              id="exercise-modal-title"
              className="text-2xl font-bold text-gray-900 pr-8"
            >
              {exerciseCard.name}
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Badges and Tags */}
          <div className="flex flex-wrap gap-2">
            {exerciseCard.difficulty && (
              <DifficultyBadge difficulty={exerciseCard.difficulty} />
            )}
            {exerciseCard.equipment && exerciseCard.equipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exerciseCard.equipment.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                  >
                    🏋️ {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Video Section */}
          {embedUrl ? (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📹</span>
                Video Demonstration
              </h3>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  src={embedUrl}
                  title={`${exerciseCard.name} demonstration`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              {exerciseCard.video_start_time && exerciseCard.video_end_time && (
                <p className="text-sm text-gray-600 mt-2">
                  Demonstration: {exerciseCard.video_start_time} -{' '}
                  {exerciseCard.video_end_time}
                </p>
              )}
            </section>
          ) : exerciseCard.video_url ? (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📹</span>
                Video Demonstration
              </h3>
              <a
                href={exerciseCard.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors"
              >
                <div className="text-4xl mb-2">🎥</div>
                <p className="text-blue-600 font-medium">View Video</p>
              </a>
            </section>
          ) : null}

          {/* Instructions Section */}
          {exerciseCard.instructions && exerciseCard.instructions.length > 0 ? (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Step-by-Step Instructions
              </h3>
              <ol className="space-y-3">
                {exerciseCard.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-semibold mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">
                      {instruction}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Instructions
              </h3>
              <p className="text-gray-500 italic">
                No instructions available for this exercise.
              </p>
            </section>
          )}

          {/* Coaching Cues Section */}
          {exerciseCard.coaching_cues && exerciseCard.coaching_cues.length > 0 ? (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">💡</span>
                Coaching Cues
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                <ul className="space-y-2">
                  {exerciseCard.coaching_cues.map((cue, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1 flex-shrink-0">
                        •
                      </span>
                      <span className="text-gray-700">{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Screenshots Section */}
          {exerciseCard.screenshot_timestamps &&
            exerciseCard.screenshot_timestamps.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📸</span>
                  Key Positions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {exerciseCard.screenshot_timestamps.map((timestamp, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center mb-2">
                        <div className="text-center">
                          <div className="text-3xl mb-1">⏱️</div>
                          <span className="text-gray-600 text-sm font-medium">
                            {timestamp}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Frame {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Metadata Section */}
          {(exerciseCard.primary_muscle_groups ||
            exerciseCard.exercise_type) && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">ℹ️</span>
                Exercise Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {exerciseCard.primary_muscle_groups &&
                  exerciseCard.primary_muscle_groups.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">
                        Primary Muscle Groups
                      </dt>
                      <dd className="flex flex-wrap gap-2">
                        {exerciseCard.primary_muscle_groups.map((muscle) => (
                          <span
                            key={muscle}
                            className="inline-block px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800"
                          >
                            {muscle}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                {exerciseCard.exercise_type && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      Exercise Type
                    </dt>
                    <dd>
                      <span className="inline-block px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 capitalize">
                        {exerciseCard.exercise_type}
                      </span>
                    </dd>
                  </div>
                )}
                {exerciseCard.default_rest_seconds > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">
                      Recommended Rest
                    </dt>
                    <dd className="text-gray-700">
                      {formatRestTime(exerciseCard.default_rest_seconds)}
                    </dd>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <Button onClick={onClose} variant="primary" fullWidth>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper Components

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colorMap: Record<string, string> = {
    beginner: 'success',
    intermediate: 'info',
    advanced: 'danger',
  }

  return (
    <Badge variant={colorMap[difficulty] as any} size="md">
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  )
}

// Helper Functions

function extractYouTubeVideoId(url: string | null): string | null {
  if (!url) return null

  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

function timeToSeconds(timeString: string | null): number | null {
  if (!timeString) return null

  // Parse formats like "01:30" or "1:30:45"
  const parts = timeString.split(':').map(Number)

  if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
    // mm:ss
    return parts[0] * 60 + parts[1]
  } else if (
    parts.length === 3 &&
    parts[0] !== undefined &&
    parts[1] !== undefined &&
    parts[2] !== undefined
  ) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  return null
}

function formatRestTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
