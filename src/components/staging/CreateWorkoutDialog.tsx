/**
 * Create Workout Dialog Component
 *
 * Simple dialog for creating a new workout with just a name.
 * User can organize into programs later via program management UI.
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CreateWorkoutDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Called when dialog is closed */
  onClose: () => void
  /** Called when workout is created, with the new workout's ID and name */
  onCreate: (workoutId: string, workoutName: string) => void
}

export function CreateWorkoutDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkoutDialogProps) {
  const [workoutName, setWorkoutName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workoutName.trim()) {
      setError('Please enter a workout name')
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      // First, we need a program to attach the workout to
      // Check if there's a default "Unassigned" program, or create one
      let programId: string

      const { data: existingProgram } = await supabase
        .from('programs')
        .select('id')
        .eq('name', 'Unassigned')
        .single()

      if (existingProgram) {
        programId = existingProgram.id
      } else {
        // Create a default program for unassigned workouts
        const { data: newProgram, error: programError } = await supabase
          .from('programs')
          .insert({
            name: 'Unassigned',
            description: 'Workouts not yet assigned to a program',
            status: 'active',
          })
          .select('id')
          .single()

        if (programError) throw programError
        programId = newProgram.id
      }

      // Create the workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          name: workoutName.trim(),
          program_id: programId,
          notes: 'Created from video analysis staging',
        })
        .select('id, name')
        .single()

      if (workoutError) throw workoutError

      // Reset form and call callback
      setWorkoutName('')
      onCreate(workout.id, workout.name)
    } catch (err) {
      console.error('Error creating workout:', err)
      setError('Failed to create workout. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setWorkoutName('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Create New Workout
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label
              htmlFor="workoutName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Workout Name
            </label>
            <input
              type="text"
              id="workoutName"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Upper Body A, Leg Day, etc."
              autoFocus
              disabled={isCreating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can organize this workout into a program later
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !workoutName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Creating...
                </>
              ) : (
                'Create & Add Exercises'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
