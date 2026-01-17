/**
 * Exercise Logger Component
 *
 * Handles logging individual sets for an exercise during a workout.
 * Features:
 * - Dynamic input fields based on exercise tracking configuration
 * - Pre-population from previous session data
 * - Set-by-set progression
 * - Success animations and feedback
 */

import { useState, useEffect } from 'react'
import type { WorkoutExercise, ExerciseCard, ExerciseLog, CreateExerciseLogInput } from '@/lib/types'
import { Button, Input, Select } from '@/components/common'

interface ExerciseLoggerProps {
  exercise: WorkoutExercise & { exercise_card: ExerciseCard }
  sessionId: string
  previousLogs?: ExerciseLog[]
  onLogSet: (setData: CreateExerciseLogInput) => void
  isLogging: boolean
}

export function ExerciseLogger({
  exercise,
  sessionId,
  previousLogs = [],
  onLogSet,
  isLogging,
}: ExerciseLoggerProps) {
  const { exercise_card, prescribed_sets } = exercise
  const totalSets = prescribed_sets.length

  const [currentSet, setCurrentSet] = useState(1)
  const [formData, setFormData] = useState({
    weight: '',
    reps: '',
    duration_seconds: '',
    rpe: '',
  })
  const [showSuccess, setShowSuccess] = useState(false)

  // Get previous log for current set
  const previousLog = previousLogs.find(log => log.set_number === currentSet)
  const prescribedSet = prescribed_sets.find(s => s.set === currentSet)

  // Pre-populate form with previous data
  useEffect(() => {
    if (previousLog) {
      setFormData({
        weight: previousLog.weight?.toString() || '',
        reps: previousLog.reps?.toString() || '',
        duration_seconds: previousLog.duration_seconds?.toString() || '',
        rpe: previousLog.rpe?.toString() || '',
      })
    }
  }, [currentSet, previousLog])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogSet = () => {
    // Validate required fields
    if (exercise_card.tracks_weight && !formData.weight) return
    if (exercise_card.tracks_reps && !formData.reps) return
    if (exercise_card.tracks_duration && !formData.duration_seconds) return

    const setData: CreateExerciseLogInput = {
      workout_session_id: sessionId,
      workout_exercise_id: exercise.id,
      set_number: currentSet,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      reps: formData.reps ? parseInt(formData.reps, 10) : null,
      duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds, 10) : null,
      distance: null,
      rpe: formData.rpe ? parseInt(formData.rpe, 10) : null,
      completed: true,
      notes: null,
    }

    onLogSet(setData)

    // Show success animation
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)

      // Advance to next set if not the last
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1)
        // Reset form for next set
        setFormData({
          weight: '',
          reps: '',
          duration_seconds: '',
          rpe: '',
        })
      }
    }, 500)
  }

  const isValid = () => {
    if (exercise_card.tracks_weight && !formData.weight) return false
    if (exercise_card.tracks_reps && !formData.reps) return false
    if (exercise_card.tracks_duration && !formData.duration_seconds) return false
    return true
  }

  // Format previous data display
  const formatPreviousData = () => {
    if (!previousLog) return null

    const parts: string[] = []
    if (previousLog.weight) parts.push(`${previousLog.weight} lbs`)
    if (previousLog.reps) parts.push(`${previousLog.reps} reps`)
    if (previousLog.duration_seconds) parts.push(`${previousLog.duration_seconds} sec`)
    if (previousLog.rpe) parts.push(`RPE ${previousLog.rpe}`)

    return parts.length > 0 ? `Last: ${parts.join(' × ')}` : null
  }

  // Format prescription display
  const formatPrescription = () => {
    if (!prescribedSet) return ''

    const parts: string[] = []
    if (prescribedSet.weight_pct) parts.push(`${prescribedSet.weight_pct}%`)
    if (prescribedSet.reps) parts.push(`x${prescribedSet.reps}`)
    if (prescribedSet.duration_seconds) parts.push(`${prescribedSet.duration_seconds}s`)
    if (prescribedSet.tempo) parts.push(`@ ${prescribedSet.tempo}`)

    return parts.join(' ')
  }

  const rpeOptions = [
    { value: '', label: 'Select RPE' },
    ...Array.from({ length: 10 }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    })),
  ]

  return (
    <div className="mb-6">
      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {exercise.superset_group && (
              <span className="text-blue-600 mr-2">{exercise.superset_group}.</span>
            )}
            {exercise_card.short_name || exercise_card.name}
          </h3>
          {exercise.notes && (
            <p className="text-sm text-gray-600 mt-1">{exercise.notes}</p>
          )}
        </div>
        {/* Info icon placeholder for exercise details */}
        <button
          className="text-gray-400 hover:text-gray-600"
          aria-label="Exercise info"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Set Logger */}
      <div className={`border rounded-lg p-4 ${showSuccess ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200'} transition-colors`}>
        {/* Set Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-semibold text-gray-900">
              Set {currentSet} of {totalSets}
            </span>
            {prescribedSet && (
              <span className="ml-2 text-sm text-gray-600">
                {formatPrescription()}
              </span>
            )}
          </div>
          {showSuccess && (
            <div className="flex items-center text-green-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Logged!</span>
            </div>
          )}
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {exercise_card.tracks_weight && (
            <Input
              label="Weight (lbs)"
              type="number"
              step="0.5"
              inputMode="decimal"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder={previousLog?.weight?.toString() || '0'}
              disabled={isLogging || showSuccess}
            />
          )}

          {exercise_card.tracks_reps && (
            <Input
              label="Reps"
              type="number"
              step="1"
              inputMode="numeric"
              value={formData.reps}
              onChange={(e) => handleInputChange('reps', e.target.value)}
              placeholder={previousLog?.reps?.toString() || '0'}
              disabled={isLogging || showSuccess}
            />
          )}

          {exercise_card.tracks_duration && (
            <Input
              label="Duration (sec)"
              type="number"
              step="5"
              inputMode="numeric"
              value={formData.duration_seconds}
              onChange={(e) => handleInputChange('duration_seconds', e.target.value)}
              placeholder={previousLog?.duration_seconds?.toString() || '0'}
              disabled={isLogging || showSuccess}
            />
          )}

          {/* RPE Selector - Always shown but optional */}
          <Select
            label="RPE"
            value={formData.rpe}
            onChange={(e) => handleInputChange('rpe', e.target.value)}
            options={rpeOptions}
            disabled={isLogging || showSuccess}
          />
        </div>

        {/* Previous Data Display */}
        {formatPreviousData() && (
          <div className="text-sm text-gray-500 mb-3">
            {formatPreviousData()}
          </div>
        )}

        {/* Log Set Button */}
        <Button
          fullWidth
          onClick={handleLogSet}
          disabled={!isValid() || isLogging || showSuccess}
          loading={isLogging}
          variant="primary"
        >
          {showSuccess ? 'Logged!' : 'Log Set'}
        </Button>

        {/* Prescription Notes */}
        {prescribedSet?.notes && (
          <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-2 rounded">
            <strong>Note:</strong> {prescribedSet.notes}
          </div>
        )}
      </div>

      {/* Future Sets Preview */}
      {currentSet < totalSets && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          {totalSets - currentSet} {totalSets - currentSet === 1 ? 'set' : 'sets'} remaining
        </div>
      )}
    </div>
  )
}
