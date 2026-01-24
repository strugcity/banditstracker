/**
 * Workout Picker Dialog Component
 *
 * Dialog for selecting existing workouts to add exercises to.
 * Shows workouts grouped by program with exercise counts.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'

interface WorkoutWithDetails extends Workout {
  exercise_count: number
  program_name: string | null
}

interface WorkoutPickerDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Called when dialog is closed */
  onClose: () => void
  /** Called when a workout is selected */
  onSelect: (workoutId: string, workoutName: string) => void
  /** Called when user wants to create a new workout */
  onCreateNew: () => void
}

export function WorkoutPickerDialog({
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
}: WorkoutPickerDialogProps) {
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchWorkouts()
    }
  }, [isOpen])

  async function fetchWorkouts() {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch workouts with program names and exercise counts
      const { data, error: fetchError } = await supabase
        .from('workouts')
        .select(`
          *,
          programs!workouts_program_id_fkey(name),
          workout_exercises(count)
        `)
        .order('name')

      if (fetchError) throw fetchError

      const workoutsWithDetails: WorkoutWithDetails[] = (data || []).map((w) => ({
        ...w,
        program_name: w.programs?.name || null,
        exercise_count: w.workout_exercises?.[0]?.count || 0,
      }))

      setWorkouts(workoutsWithDetails)
    } catch (err) {
      console.error('Error fetching workouts:', err)
      setError('Failed to load workouts')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter workouts by search query
  const filteredWorkouts = workouts.filter((workout) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      workout.name.toLowerCase().includes(searchLower) ||
      (workout.program_name?.toLowerCase().includes(searchLower) ?? false)
    )
  })

  // Group workouts by program
  const groupedWorkouts = filteredWorkouts.reduce<
    Record<string, WorkoutWithDetails[]>
  >((groups, workout) => {
    const groupName = workout.program_name || 'No Program'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(workout)
    return groups
  }, {})

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Add to Workout
            </h3>
            <button
              onClick={onClose}
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

          {/* Search Input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workouts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Create New Option */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 border-b border-gray-100 text-blue-600"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-medium">Create New Workout</p>
            <p className="text-sm text-gray-500">
              Start fresh with a new workout
            </p>
          </div>
        </button>

        {/* Workout List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? (
                <>
                  <p>No workouts match your search</p>
                  <button
                    onClick={onCreateNew}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Create a new workout instead
                  </button>
                </>
              ) : (
                <>
                  <p>No workouts yet</p>
                  <button
                    onClick={onCreateNew}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Create your first workout
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedWorkouts).map(([programName, items]) => (
                <div key={programName} className="mb-4">
                  {/* Program Header */}
                  <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {programName}
                    </p>
                  </div>

                  {/* Workouts in Program */}
                  {items.map((workout) => (
                    <button
                      key={workout.id}
                      onClick={() => onSelect(workout.id, workout.name)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {workout.name}
                        </p>
                        {workout.day_of_week && (
                          <p className="text-sm text-gray-500">
                            {workout.day_of_week}
                            {workout.week_number
                              ? ` • Week ${workout.week_number}`
                              : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {workout.exercise_count} exercises
                        </span>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
