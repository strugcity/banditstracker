/**
 * Program Detail Page Component
 *
 * Shows workouts for a specific program grouped by week.
 * Features:
 * - Displays workouts grouped by week
 * - Highlights today's workout
 * - Collapsible week accordions
 * - Mobile-first responsive design
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getProgramById, getWorkoutsByProgram } from '../lib/queries'
import type { Workout } from '../lib/types'
import { Button, Card, EmptyState, Spinner } from '../components/common'

/**
 * Group workouts by week number
 */
function groupWorkoutsByWeek(workouts: Workout[]): Record<number, Workout[]> {
  return workouts.reduce((acc, workout) => {
    const week = workout.week_number || 0
    if (!acc[week]) {
      acc[week] = []
    }
    acc[week].push(workout)
    return acc
  }, {} as Record<number, Workout[]>)
}

/**
 * Get current day of week for today detection
 */
function getTodayDayOfWeek(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Find the week number containing today's workout
 */
function findCurrentWeek(workouts: Workout[], today: string): number | null {
  const workout = workouts.find(w => w.day_of_week === today)
  return workout?.week_number || null
}

/**
 * Week Accordion Component
 */
interface WeekAccordionProps {
  weekNumber: number
  workouts: Workout[]
  today: string
  isExpanded: boolean
  onToggle: () => void
  onWorkoutClick: (workoutId: string) => void
}

function WeekAccordion({
  weekNumber,
  workouts,
  today,
  isExpanded,
  onToggle,
  onWorkoutClick,
}: WeekAccordionProps) {
  return (
    <div className="mb-4">
      {/* Week Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`week-${weekNumber}-content`}
      >
        <h2 className="font-semibold text-lg text-gray-900">
          Week {weekNumber}
        </h2>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Week Content */}
      {isExpanded && (
        <div id={`week-${weekNumber}-content`} className="divide-y divide-gray-100">
          {workouts.map((workout) => {
            const isToday = workout.day_of_week === today

            return (
              <button
                key={workout.id}
                onClick={() => onWorkoutClick(workout.id)}
                className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
                  isToday
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'bg-white hover:bg-gray-50'
                }`}
                aria-label={`Start ${workout.day_of_week} workout: ${workout.name}`}
              >
                <div className="flex items-center gap-3">
                  {/* Today Indicator Dot */}
                  {isToday && (
                    <div
                      className="w-2 h-2 rounded-full bg-blue-500"
                      aria-hidden="true"
                    />
                  )}

                  <div className="text-left">
                    <div className="font-bold text-gray-900">
                      {workout.day_of_week || 'Day'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {workout.name}
                    </div>
                  </div>
                </div>

                {/* Right Arrow */}
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Program Detail Page Component
 */
export function ProgramDetailPage() {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const currentWeekRef = useRef<HTMLDivElement>(null)
  const today = getTodayDayOfWeek()

  // Fetch program details
  const {
    data: program,
    isLoading: programLoading,
    error: programError,
  } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => getProgramById(programId!),
    enabled: !!programId,
  })

  // Fetch workouts for program
  const {
    data: workouts,
    isLoading: workoutsLoading,
    error: workoutsError,
  } = useQuery({
    queryKey: ['workouts', programId],
    queryFn: () => getWorkoutsByProgram(programId!),
    enabled: !!programId,
  })

  // Group workouts by week
  const workoutsByWeek = workouts ? groupWorkoutsByWeek(workouts) : {}
  const weekNumbers = Object.keys(workoutsByWeek)
    .map(Number)
    .sort((a, b) => a - b)

  // Set up expanded weeks and scroll to current week
  useEffect(() => {
    if (workouts && workouts.length > 0) {
      const currentWeek = findCurrentWeek(workouts, today)

      // Expand all weeks by default
      setExpandedWeeks(new Set(weekNumbers))

      // Scroll to current week after a brief delay to ensure DOM is ready
      if (currentWeek !== null) {
        setTimeout(() => {
          currentWeekRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 100)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, today])

  // Toggle week expansion
  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(weekNumber)) {
        next.delete(weekNumber)
      } else {
        next.add(weekNumber)
      }
      return next
    })
  }

  // Navigate to workout detail
  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/workout/${workoutId}`)
  }

  // Loading state
  if (programLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading program...</p>
        </div>
      </div>
    )
  }

  // Error state - program failed to load
  if (programError || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Program Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              {programError instanceof Error
                ? programError.message
                : 'This program could not be found'}
            </p>
            <Button onClick={() => navigate('/programs')} variant="primary">
              View All Programs
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Workouts loading state
  if (workoutsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center py-8">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Loading workouts...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state - workouts failed to load
  if (workoutsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">
              {program?.name}
            </h1>
            {program?.sport && program?.season && (
              <p className="text-sm text-gray-600">
                {program.sport} • {program.season}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        <div className="max-w-2xl mx-auto p-4">
          <Card>
            <div className="text-center py-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Failed to Load Workouts
              </h2>
              <p className="text-gray-600 mb-4">
                {workoutsError instanceof Error
                  ? workoutsError.message
                  : 'An unexpected error occurred'}
              </p>
              <Button onClick={() => window.location.reload()} variant="primary">
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // No workouts found for program
  if (!workouts || workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {program?.name}
              </h1>
              {program?.sport && program?.season && (
                <p className="text-sm text-gray-600">
                  {program.sport} • {program.season}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-2xl mx-auto p-4">
          <EmptyState
            title="No Workouts Found"
            message="No workouts found for this program. Contact your coach to add workouts."
            icon="🏋️"
          />
        </div>
      </div>
    )
  }

  const currentWeek = findCurrentWeek(workouts, today)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {program?.name}
            </h1>
            {program?.sport && program?.season && (
              <p className="text-sm text-gray-600">
                {program.sport} • {program.season}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Workouts Section */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-0">
          {weekNumbers.map((weekNumber) => {
            const isCurrentWeek = weekNumber === currentWeek

            return (
              <div
                key={weekNumber}
                ref={isCurrentWeek ? currentWeekRef : null}
              >
                <WeekAccordion
                  weekNumber={weekNumber}
                  workouts={workoutsByWeek[weekNumber] || []}
                  today={today}
                  isExpanded={expandedWeeks.has(weekNumber)}
                  onToggle={() => toggleWeek(weekNumber)}
                  onWorkoutClick={handleWorkoutClick}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
