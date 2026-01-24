/**
 * Exercises Page Component
 *
 * Shows exercise library with video analysis form and staging modal.
 * Users can analyze videos and review/edit exercises before saving.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'
import { VideoStagingModal } from '@/components/staging'
import { Badge, Spinner } from '@/components/common'

interface Exercise {
  id: string
  name: string
  difficulty: string | null
  equipment: string[] | null
  video_url: string | null
  video_start_time: string | null
  video_end_time: string | null
  instructions: string[] | null
  coaching_cues: string[] | null
  screenshot_timestamps: string[] | null
  screenshot_urls: string[] | null
  exercise_type: string | null
  is_new: boolean | null
  source_session_id: string | null
  created_at: string
}

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  // Staging modal state
  const [stagingSessionId, setStagingSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchExercises()
  }, [])

  async function fetchExercises() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('exercise_cards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setExercises(data || [])
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Hide Form' : '+ Analyze Video'}
          </button>
        </div>
        <p className="text-gray-600">
          {showForm
            ? 'Analyze training videos to automatically build your exercise library'
            : `${exercises.length} exercises in your library`
          }
        </p>
      </div>

      {/* Video Analysis Form */}
      {showForm && (
        <div className="mb-8">
          <VideoAnalysisForm
            onAnalysisComplete={(sessionId) => {
              // Open the staging modal with the new session
              setStagingSessionId(sessionId)
            }}
            onError={(error) => {
              console.error('Video analysis error:', error)
            }}
          />
        </div>
      )}

      {/* Exercise Library */}
      {!showForm && (
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No exercises yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Analyze Your First Video
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Exercise Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {exercise.name}
                      </h3>
                      {exercise.is_new && (
                        <Badge className="bg-emerald-100 text-emerald-800 animate-pulse">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exercise.difficulty && (
                        <Badge
                          className={
                            exercise.difficulty === 'beginner'
                              ? 'bg-green-100 text-green-800'
                              : exercise.difficulty === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {exercise.difficulty}
                        </Badge>
                      )}
                      {exercise.exercise_type && (
                        <Badge className="bg-blue-100 text-blue-800">
                          {exercise.exercise_type}
                        </Badge>
                      )}
                      {exercise.video_start_time && (
                        <Badge className="bg-gray-100 text-gray-700">
                          {exercise.video_start_time} - {exercise.video_end_time}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Equipment */}
                  {exercise.equipment && exercise.equipment.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Equipment:</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.equipment.map((item, i) => (
                          <Badge key={i} size="sm" className="bg-purple-100 text-purple-800">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions Preview */}
                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Instructions:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        {exercise.instructions.slice(0, 3).map((instruction, i) => (
                          <li key={i}>{instruction}</li>
                        ))}
                        {exercise.instructions.length > 3 && (
                          <li className="text-gray-400">
                            +{exercise.instructions.length - 3} more...
                          </li>
                        )}
                      </ol>
                    </div>
                  )}

                  {/* Video Link */}
                  {exercise.video_url && (
                    <a
                      href={exercise.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:underline"
                    >
                      Watch video →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedExercise.name}
                </h2>
                {selectedExercise.is_new && (
                  <Badge className="bg-emerald-100 text-emerald-800">
                    New
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedExercise.difficulty && (
                  <Badge
                    className={
                      selectedExercise.difficulty === 'beginner'
                        ? 'bg-green-100 text-green-800'
                        : selectedExercise.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {selectedExercise.difficulty}
                  </Badge>
                )}
                {selectedExercise.exercise_type && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedExercise.exercise_type}
                  </Badge>
                )}
                {selectedExercise.video_start_time && (
                  <Badge className="bg-gray-100 text-gray-700">
                    {selectedExercise.video_start_time} - {selectedExercise.video_end_time}
                  </Badge>
                )}
              </div>

              {/* Equipment */}
              {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.equipment.map((item, i) => (
                      <Badge key={i} className="bg-purple-100 text-purple-800">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    {selectedExercise.instructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Coaching Cues */}
              {selectedExercise.coaching_cues && selectedExercise.coaching_cues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Coaching Cues</h3>
                  <ul className="space-y-2">
                    {selectedExercise.coaching_cues.map((cue, i) => (
                      <li key={i} className="flex items-start text-gray-600">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Screenshot Timestamps */}
              {selectedExercise.screenshot_timestamps && selectedExercise.screenshot_timestamps.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Form Moments</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.screenshot_timestamps.map((timestamp, i) => (
                      <Badge key={i} className="bg-indigo-100 text-indigo-800">
                        {timestamp}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    AI identified these moments as best showing proper form
                  </p>
                </div>
              )}

              {/* Video Link */}
              {selectedExercise.video_url && (
                <div className="mb-4">
                  <a
                    href={selectedExercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Watch Video
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Staging Modal */}
      {stagingSessionId && (
        <VideoStagingModal
          sessionId={stagingSessionId}
          isOpen={!!stagingSessionId}
          onClose={() => setStagingSessionId(null)}
          onComplete={() => {
            setStagingSessionId(null)
            // Refresh exercises list to show newly imported exercises
            fetchExercises()
          }}
        />
      )}
    </div>
  )
}
