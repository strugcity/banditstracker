/**
 * Video Staging Modal Component
 *
 * Inline modal for reviewing and editing AI-extracted exercises from video analysis.
 * Features:
 * - View all extracted exercises
 * - Edit exercise details before saving
 * - Save individual exercises or batch save
 * - Add exercises to workouts
 * - Session expiry countdown
 * - Responsive design (bottom sheet on mobile)
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Badge } from '@/components/common'
import { ExerciseEditorCard } from './ExerciseEditorCard'
import { ExpiryCountdown } from './ExpiryCountdown'
import { WorkoutPickerDialog } from './WorkoutPickerDialog'
import { CreateWorkoutDialog } from './CreateWorkoutDialog'
import type {
  VideoStagingModalProps,
  VideoAnalysisSession,
  StagedExercise,
  ExerciseEdit,
  ImportToLibraryResponse,
} from '@/types/staging'
import { toStagedExercise, extractEdits } from '@/types/staging'

export function VideoStagingModal({
  sessionId,
  isOpen,
  onClose,
  onComplete,
}: VideoStagingModalProps) {
  // State
  const [session, setSession] = useState<VideoAnalysisSession | null>(null)
  const [exercises, setExercises] = useState<StagedExercise[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [successLink, setSuccessLink] = useState<{ url: string; text: string } | null>(null)

  // Workout dialog state
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false)
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [isAddingToWorkout, setIsAddingToWorkout] = useState(false)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isSaving, onClose])

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      if (!isOpen || !sessionId) return

      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('video_analysis_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('Session not found')

        const sessionData = data as VideoAnalysisSession
        setSession(sessionData)

        // Convert exercises to staged format with any existing edits
        const stagedExercises = sessionData.analysis_result.exercises.map(
          (exercise, index) => {
            const edits = sessionData.edited_exercises?.[index.toString()]
            const savedId = sessionData.imported_exercise_ids?.find(
              (id, i) => i === index
            )
            return toStagedExercise(exercise, index, edits, savedId)
          }
        )

        setExercises(stagedExercises)

        // Select all non-saved exercises by default
        const unsavedIndices = stagedExercises
          .filter((ex) => !ex.isSaved)
          .map((ex) => ex.originalIndex)
        setSelectedIndices(new Set(unsavedIndices))
      } catch (err) {
        console.error('Error fetching session:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [isOpen, sessionId])

  // Toggle selection
  const handleToggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  // Toggle expanded
  const handleToggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index))
  }, [])

  // Handle exercise changes
  const handleExerciseChange = useCallback(
    (index: number, updates: Partial<StagedExercise>) => {
      setExercises((prev) =>
        prev.map((ex) =>
          ex.originalIndex === index
            ? { ...ex, ...updates, isEdited: true }
            : ex
        )
      )
    },
    []
  )

  // Select all
  const handleSelectAll = useCallback(() => {
    const unsavedIndices = exercises
      .filter((ex) => !ex.isSaved)
      .map((ex) => ex.originalIndex)
    setSelectedIndices(new Set(unsavedIndices))
  }, [exercises])

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedIndices(new Set())
  }, [])

  // Save individual exercise
  const handleSaveIndividual = useCallback(
    async (index: number) => {
      if (!session) return

      setSavingIndex(index)
      setError(null)

      try {
        const exercise = exercises.find((ex) => ex.originalIndex === index)
        if (!exercise) throw new Error('Exercise not found')

        // Extract edits
        const original = session.analysis_result.exercises[index]
        const edits = extractEdits(exercise, original)

        const response = await supabase.functions.invoke<ImportToLibraryResponse>(
          'import-to-library',
          {
            body: {
              sessionId: session.id,
              exerciseIndices: [index],
              editedExercises: edits ? { [index]: edits } : undefined,
              markComplete: false,
            },
          }
        )

        if (response.error) {
          throw new Error(response.error.message || 'Failed to save exercise')
        }

        const savedExercise = response.data?.exercises?.[0]

        // Update exercise state
        setExercises((prev) =>
          prev.map((ex) =>
            ex.originalIndex === index
              ? { ...ex, isSaved: true, savedExerciseId: savedExercise?.id }
              : ex
          )
        )

        // Remove from selection
        setSelectedIndices((prev) => {
          const next = new Set(prev)
          next.delete(index)
          return next
        })

        setSuccessMessage(`Saved "${exercise.name}" to library`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (err) {
        console.error('Error saving exercise:', err)
        setError(err instanceof Error ? err.message : 'Failed to save')
      } finally {
        setSavingIndex(null)
      }
    },
    [session, exercises]
  )

  // Save selected exercises
  const handleSaveSelected = useCallback(async () => {
    if (!session || selectedIndices.size === 0) return

    setIsSaving(true)
    setError(null)

    try {
      // Build edits for selected exercises
      const editedExercises: Record<number, ExerciseEdit> = {}
      for (const index of selectedIndices) {
        const exercise = exercises.find((ex) => ex.originalIndex === index)
        if (!exercise) continue

        const original = session.analysis_result.exercises[index]
        const edits = extractEdits(exercise, original)
        if (edits) {
          editedExercises[index] = edits
        }
      }

      const allSelected =
        selectedIndices.size === exercises.filter((ex) => !ex.isSaved).length

      const response = await supabase.functions.invoke<ImportToLibraryResponse>(
        'import-to-library',
        {
          body: {
            sessionId: session.id,
            exerciseIndices: Array.from(selectedIndices),
            editedExercises:
              Object.keys(editedExercises).length > 0
                ? editedExercises
                : undefined,
            markComplete: allSelected,
          },
        }
      )

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save exercises')
      }

      const data = response.data!

      // Update exercises state
      const savedIds = new Set(data.exercises.map((e) => e.id))
      setExercises((prev) =>
        prev.map((ex) => {
          if (selectedIndices.has(ex.originalIndex)) {
            const saved = data.exercises.find((e) => e.name === ex.name)
            return { ...ex, isSaved: true, savedExerciseId: saved?.id }
          }
          return ex
        })
      )

      // Clear selection
      setSelectedIndices(new Set())

      setSuccessMessage(
        `Saved ${data.inserted} new and updated ${data.updated} exercises`
      )

      // If all completed, close after delay
      if (data.sessionStatus === 'completed') {
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Error saving exercises:', err)
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [session, exercises, selectedIndices, onComplete])

  // Add selected exercises to workout
  const handleAddToWorkout = useCallback(
    async (workoutId: string, workoutName: string) => {
      if (!session || selectedIndices.size === 0) return

      setIsAddingToWorkout(true)
      setShowWorkoutPicker(false)
      setShowCreateWorkout(false)
      setError(null)

      try {
        // Build edits for selected exercises
        const editedExercises: Record<number, ExerciseEdit> = {}
        for (const index of selectedIndices) {
          const exercise = exercises.find((ex) => ex.originalIndex === index)
          if (!exercise) continue

          const original = session.analysis_result.exercises[index]
          const edits = extractEdits(exercise, original)
          if (edits) {
            editedExercises[index] = edits
          }
        }

        const response = await supabase.functions.invoke('add-exercises-to-workout', {
          body: {
            sessionId: session.id,
            exerciseIndices: Array.from(selectedIndices),
            workoutId,
            editedExercises:
              Object.keys(editedExercises).length > 0 ? editedExercises : undefined,
          },
        })

        if (response.error) {
          throw new Error(response.error.message || 'Failed to add exercises to workout')
        }

        const data = response.data

        // Update exercises state to mark them as saved
        setExercises((prev) =>
          prev.map((ex) => {
            if (selectedIndices.has(ex.originalIndex)) {
              return { ...ex, isSaved: true }
            }
            return ex
          })
        )

        // Clear selection
        setSelectedIndices(new Set())

        const programId = data?.programId
        setSuccessMessage(
          `Added ${data?.added || selectedIndices.size} exercises to "${workoutName}"`
        )
        if (programId) {
          setSuccessLink({ url: `/programs/${programId}`, text: 'View workout in program' })
        } else {
          setSuccessLink({ url: '/programs', text: 'View in Programs' })
        }
        setTimeout(() => {
          setSuccessMessage(null)
          setSuccessLink(null)
        }, 8000)
      } catch (err) {
        console.error('Error adding exercises to workout:', err)
        setError(err instanceof Error ? err.message : 'Failed to add to workout')
      } finally {
        setIsAddingToWorkout(false)
      }
    },
    [session, exercises, selectedIndices]
  )

  // Handle workout creation and add exercises
  const handleCreateWorkoutAndAdd = useCallback(
    (workoutId: string, workoutName: string) => {
      handleAddToWorkout(workoutId, workoutName)
    },
    [handleAddToWorkout]
  )

  // Close and discard
  const handleClose = useCallback(() => {
    if (isSaving || isAddingToWorkout) return
    onClose()
  }, [isSaving, isAddingToWorkout, onClose])

  if (!isOpen) return null

  const selectedCount = selectedIndices.size
  const unsavedCount = exercises.filter((ex) => !ex.isSaved).length
  const allSaved = unsavedCount === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staging-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl transform transition-all flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2
                id="staging-modal-title"
                className="text-xl font-bold text-gray-900 pr-8"
              >
                {isLoading
                  ? 'Loading...'
                  : session?.video_title || 'Review Exercises'}
              </h2>
              {session && (
                <div className="flex items-center gap-2 mt-1">
                  {session.sport && (
                    <Badge variant="info" size="sm">
                      {session.sport}
                    </Badge>
                  )}
                  {session.total_duration && (
                    <span className="text-sm text-gray-500">
                      {session.total_duration}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {exercises.length} exercise
                    {exercises.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50"
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

          {/* Expiry countdown */}
          {session?.expires_at && (
            <ExpiryCountdown expiresAt={session.expires_at} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <span className="ml-3 text-gray-600">Loading exercises...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-2">Error</div>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : allSaved ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All Exercises Saved!
              </h3>
              <p className="text-gray-600 mb-4">
                All {exercises.length} exercises have been added to your
                library.
              </p>
              <Button onClick={onComplete} variant="primary">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Selection controls */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{selectedCount}</span> of{' '}
                  <span className="font-semibold">{unsavedCount}</span> selected
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedCount === unsavedCount}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedCount === 0}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Exercise cards */}
              <div className="space-y-3">
                {exercises.map((exercise) => (
                  <ExerciseEditorCard
                    key={exercise.originalIndex}
                    exercise={exercise}
                    index={exercise.originalIndex}
                    isSelected={selectedIndices.has(exercise.originalIndex)}
                    isExpanded={expandedIndex === exercise.originalIndex}
                    onToggleSelect={() =>
                      handleToggleSelect(exercise.originalIndex)
                    }
                    onToggleExpand={() =>
                      handleToggleExpand(exercise.originalIndex)
                    }
                    onChange={(updates) =>
                      handleExerciseChange(exercise.originalIndex, updates)
                    }
                    onSaveIndividual={() =>
                      handleSaveIndividual(exercise.originalIndex)
                    }
                    isSaving={savingIndex === exercise.originalIndex}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && !allSaved && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            {/* Success/Error messages */}
            {successMessage && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center justify-between">
                <span>{successMessage}</span>
                {successLink && (
                  <Link
                    to={successLink.url}
                    className="ml-3 text-green-700 underline hover:text-green-900 font-medium"
                    onClick={() => onComplete()}
                  >
                    {successLink.text} →
                  </Link>
                )}
              </div>
            )}
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedCount === 0
                  ? 'Select exercises to save'
                  : `Ready to save ${selectedCount} exercise${selectedCount !== 1 ? 's' : ''}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving || isAddingToWorkout}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWorkoutPicker(true)}
                  disabled={selectedCount === 0 || isSaving || isAddingToWorkout}
                >
                  {isAddingToWorkout ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Adding...
                    </>
                  ) : (
                    'Add to Workout'
                  )}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveSelected}
                  disabled={selectedCount === 0 || isSaving || isAddingToWorkout}
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    `Save to Library (${selectedCount})`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Workout Picker Dialog */}
        <WorkoutPickerDialog
          isOpen={showWorkoutPicker}
          onClose={() => setShowWorkoutPicker(false)}
          onSelect={handleAddToWorkout}
          onCreateNew={() => {
            setShowWorkoutPicker(false)
            setShowCreateWorkout(true)
          }}
        />

        {/* Create Workout Dialog */}
        <CreateWorkoutDialog
          isOpen={showCreateWorkout}
          onClose={() => setShowCreateWorkout(false)}
          onCreate={handleCreateWorkoutAndAdd}
        />
      </div>
    </div>
  )
}
