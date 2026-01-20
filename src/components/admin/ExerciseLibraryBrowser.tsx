/**
 * Exercise Library Browser
 *
 * Browse and search exercises from the library with video analysis data
 * Designed for admins/coaches to review and manage analyzed exercises
 */

import { useState, useEffect } from 'react'
import {
  getExerciseCardsWithVideo,
  searchExercises,
  getYouTubeThumbnail
} from '@/services/video-analysis'
import type { ExerciseCardWithVideo } from '@/types/video-analysis'

interface ExerciseLibraryBrowserProps {
  onSelectExercise?: (exercise: ExerciseCardWithVideo) => void
  filterByVideo?: boolean
}

export function ExerciseLibraryBrowser({
  onSelectExercise,
  filterByVideo = true
}: ExerciseLibraryBrowserProps) {
  const [exercises, setExercises] = useState<ExerciseCardWithVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCardWithVideo | null>(null)

  useEffect(() => {
    loadExercises()
  }, [selectedDifficulty])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const data = await getExerciseCardsWithVideo({
        hasVideo: filterByVideo,
        difficulty: selectedDifficulty || undefined
      })
      setExercises(data)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.length < 2) {
      loadExercises()
      return
    }

    setLoading(true)
    try {
      const results = await searchExercises(query, {
        hasVideo: filterByVideo,
        difficulty: selectedDifficulty || undefined
      })
      setExercises(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExercise = (exercise: ExerciseCardWithVideo) => {
    setSelectedExercise(exercise)
    onSelectExercise?.(exercise)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Panel: Exercise List */}
      <div className="lg:w-1/3 space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">Exercise Library</h2>

          {/* Search Bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Exercise List */}
        <div className="space-y-2 overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading exercises...</div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exercises found
              {searchQuery && ` for "${searchQuery}"`}
            </div>
          ) : (
            exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedExercise?.id === exercise.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  {exercise.video_url && (
                    <img
                      src={getYouTubeThumbnail(exercise.video_url, 'mq') || ''}
                      alt={exercise.name}
                      className="w-20 h-14 object-cover rounded"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {exercise.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {exercise.difficulty && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            exercise.difficulty === 'beginner'
                              ? 'bg-green-100 text-green-700'
                              : exercise.difficulty === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {exercise.difficulty}
                        </span>
                      )}
                      {exercise.video_url && (
                        <span className="text-xs text-blue-600">📹 Video</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Exercise Details */}
      <div className="lg:w-2/3">
        {selectedExercise ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedExercise.name}</h2>

            {/* Video */}
            {selectedExercise.video_url && (
              <div className="mb-6">
                <iframe
                  width="100%"
                  height="400"
                  src={`https://www.youtube.com/embed/${extractVideoId(
                    selectedExercise.video_url
                  )}${
                    selectedExercise.video_start_time
                      ? `?start=${timeToSeconds(selectedExercise.video_start_time)}`
                      : ''
                  }`}
                  title={selectedExercise.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
                {selectedExercise.video_start_time && selectedExercise.video_end_time && (
                  <p className="text-sm text-gray-600 mt-2">
                    Segment: {selectedExercise.video_start_time} -{' '}
                    {selectedExercise.video_end_time}
                  </p>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Difficulty</h4>
                <p className="text-gray-900 capitalize">
                  {selectedExercise.difficulty || 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Exercise Type</h4>
                <p className="text-gray-900 capitalize">
                  {selectedExercise.exercise_type || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Equipment */}
            {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Equipment</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.equipment.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Step-by-Step Instructions
                </h4>
                <ol className="space-y-2">
                  {selectedExercise.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Coaching Cues */}
            {selectedExercise.coaching_cues && selectedExercise.coaching_cues.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Coaching Cues</h4>
                <ul className="space-y-2">
                  {selectedExercise.coaching_cues.map((cue, index) => (
                    <li key={index} className="flex gap-2 text-gray-700">
                      <span className="text-yellow-500">💡</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Screenshot Gallery */}
            {selectedExercise.screenshot_urls && selectedExercise.screenshot_urls.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Moments</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedExercise.screenshot_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${selectedExercise.name} - Frame ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tracking Settings */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Tracking Settings</h4>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.tracks_weight && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                    Tracks Weight
                  </span>
                )}
                {selectedExercise.tracks_reps && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded">
                    Tracks Reps
                  </span>
                )}
                {selectedExercise.tracks_duration && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded">
                    Tracks Duration
                  </span>
                )}
                {selectedExercise.tracks_distance && (
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded">
                    Tracks Distance
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select an exercise to view details
            </h3>
            <p className="text-gray-500">
              Choose an exercise from the list to see instructions, video, and coaching cues
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to extract YouTube video ID
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  return match ? match[1] : null
}

// Helper function to convert MM:SS to seconds
function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return 0
}
