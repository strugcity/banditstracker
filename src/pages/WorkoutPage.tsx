/**
 * Workout Page Component
 *
 * Core feature where athletes actively log their workout sets in real-time.
 * Features:
 * - Three states: Not Started, In Progress, Completed
 * - Pre-populates previous session data
 * - Auto-saves each set
 * - Mobile-optimized with proper keyboard types
 * - Superset visual grouping
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkoutWithExercises,
  getPreviousSessionLogs,
  createWorkoutSession,
  logExerciseSet,
  completeWorkoutSession,
} from '@/lib/queries'
import type { CreateExerciseLogInput, ExerciseLog } from '@/lib/types'
import { Button, Card, Spinner, EmptyState } from '@/components/common'
import { ExerciseLogger } from '@/components/workout/ExerciseLogger'

type WorkoutState = 'not_started' | 'in_progress' | 'completed'

export function WorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [workoutState, setWorkoutState] = useState<WorkoutState>('not_started')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loggedSets, setLoggedSets] = useState<ExerciseLog[]>([])

  // Fetch workout with exercises
  const {
    data: workout,
    isLoading: workoutLoading,
    error: workoutError,
  } = useQuery({
    queryKey: ['workout-with-exercises', workoutId], // FIXED: Different key to avoid cache conflict with Breadcrumbs
    queryFn: () => getWorkoutWithExercises(workoutId!),
    enabled: !!workoutId,
  })

  // Fetch previous session logs
  const { data: previousLogs = [] } = useQuery({
    queryKey: ['previous-session', workoutId],
    queryFn: () => getPreviousSessionLogs(workoutId!),
    enabled: !!workoutId,
  })

  // Start workout session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => createWorkoutSession(workoutId!),
    onSuccess: (session) => {
      setSessionId(session.id)
      setWorkoutState('in_progress')
    },
  })

  // Log set mutation
  const logSetMutation = useMutation({
    mutationFn: logExerciseSet,
    onSuccess: (newLog) => {
      setLoggedSets(prev => [...prev, newLog])
      queryClient.invalidateQueries({ queryKey: ['session-logs', sessionId] })
    },
  })

  // Complete workout mutation
  const completeSessionMutation = useMutation({
    mutationFn: () => completeWorkoutSession(sessionId!),
    onSuccess: () => {
      setWorkoutState('completed')
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
    },
  })

  // Group exercises by superset
  const groupedExercises = workout?.exercises?.reduce((acc, exercise) => {
    const group = exercise.superset_group || exercise.id
    if (!acc[group]) acc[group] = []
    acc[group].push(exercise)
    return acc
  }, {} as Record<string, typeof workout.exercises>)

  // Calculate total sets
  const totalSets = workout?.exercises?.reduce(
    (sum, ex) => sum + ex.prescribed_sets.length,
    0
  ) || 0

  const loggedSetsCount = loggedSets.length

  // Handle starting workout
  const handleStartWorkout = () => {
    startSessionMutation.mutate()
  }

  // Handle logging a set
  const handleLogSet = (setData: CreateExerciseLogInput) => {
    logSetMutation.mutate(setData)
  }

  // Handle finishing workout
  const handleFinishWorkout = () => {
    const confirmMessage = `Complete workout? You've logged ${loggedSetsCount} of ${totalSets} sets.`

    if (window.confirm(confirmMessage)) {
      completeSessionMutation.mutate()
    }
  }

  // Handle going back
  const handleGoBack = () => {
    if (workoutState === 'in_progress') {
      if (window.confirm('Leave workout in progress? Your progress will be saved.')) {
        navigate(-1)
      }
    } else {
      navigate(-1)
    }
  }

  // Loading state
  if (workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading workout...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (workoutError || !workout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Workout Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              {workoutError instanceof Error
                ? workoutError.message
                : 'Unable to load this workout'}
            </p>
            <Button onClick={() => navigate('/')} variant="primary">
              Return Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // NO EXERCISES state
  if (!workout.exercises || workout.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center">
            <button
              onClick={handleGoBack}
              className="mr-4 text-gray-600 hover:text-gray-900"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{workout.name}</h1>
              <p className="text-sm text-gray-600">
                {workout.day_of_week} - Week {workout.week_number}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-2xl mx-auto p-4 mt-8">
          <EmptyState
            title="No Exercises Found"
            message="This workout doesn't have any exercises yet."
            icon="🏋️"
          />
        </div>
      </div>
    )
  }

  // NOT STARTED state
  if (workoutState === 'not_started') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center">
            <button
              onClick={handleGoBack}
              className="mr-4 text-gray-600 hover:text-gray-900"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{workout.name}</h1>
              <p className="text-sm text-gray-600">
                {workout.day_of_week} - Week {workout.week_number}
              </p>
            </div>
          </div>
        </div>

        {/* Workout Notes */}
        {workout.notes && (
          <div className="max-w-2xl mx-auto p-4">
            <Card className="bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-700">{workout.notes}</p>
            </Card>
          </div>
        )}

        {/* Exercise Preview */}
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Exercise Preview
          </h2>
          <div className="space-y-2">
            {workout.exercises.map((exercise) => (
              <Card key={exercise.id} variant="outlined">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {exercise.superset_group && (
                        <span className="text-blue-600 mr-2">
                          {exercise.superset_group}.
                        </span>
                      )}
                      {exercise.exercise_card.short_name || exercise.exercise_card.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {exercise.prescribed_sets.length} {exercise.prescribed_sets.length === 1 ? 'set' : 'sets'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={handleStartWorkout}
              loading={startSessionMutation.isPending}
              variant="primary"
            >
              Start Workout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // COMPLETED state
  if (workoutState === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Workout Complete!
          </h1>
          <p className="text-gray-600 mb-6">
            Great job! You logged {loggedSetsCount} sets.
          </p>
          <div className="space-y-3">
            <Button
              fullWidth
              onClick={() => navigate('/')}
              variant="primary"
            >
              Return Home
            </Button>
            <Button
              fullWidth
              onClick={() => navigate('/history')}
              variant="secondary"
            >
              View History
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // IN PROGRESS state
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{workout.name}</h1>
            <p className="text-sm text-gray-600">
              Progress: {loggedSetsCount} of {totalSets} sets
            </p>
          </div>
          <Button
            onClick={handleFinishWorkout}
            variant="primary"
            size="sm"
            loading={completeSessionMutation.isPending}
          >
            Finish
          </Button>
        </div>
      </div>

      {/* Exercise Loggers */}
      <div className="max-w-2xl mx-auto p-4">
        {groupedExercises && Object.entries(groupedExercises).map(([group, exercises]) => {
          const isSuperset = exercises.length > 1

          return (
            <div
              key={group}
              className={isSuperset ? 'mb-6 border-2 border-blue-200 bg-blue-50 rounded-lg p-4' : ''}
            >
              {isSuperset && (
                <div className="mb-4 text-sm font-semibold text-blue-700">
                  Superset {exercises[0]?.superset_group?.charAt(0) || ''}
                </div>
              )}

              {exercises.map((exercise) => {
                // Get previous logs for this exercise
                const exercisePreviousLogs = previousLogs.filter(
                  log => log.workout_exercise_id === exercise.id
                )

                return (
                  <ExerciseLogger
                    key={exercise.id}
                    exercise={exercise}
                    sessionId={sessionId!}
                    previousLogs={exercisePreviousLogs}
                    onLogSet={handleLogSet}
                    isLogging={logSetMutation.isPending}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
