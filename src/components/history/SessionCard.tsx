/**
 * Session Card Component
 *
 * Displays a completed workout session with expandable details
 * Features:
 * - Collapsed: shows summary (name, date, duration, sets count)
 * - Expanded: shows all exercises and logged sets
 * - Lazy loads session logs on expand
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { WorkoutSession, Workout, ExerciseLog, ExerciseCard } from '@/lib/types'
import { getSessionLogs } from '@/lib/queries'
import { Card, Spinner, Badge } from '@/components/common'

interface SessionCardProps {
  session: WorkoutSession & { workout: Workout }
}

export function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Lazy load session logs when expanded
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['session-logs', session.id],
    queryFn: () => getSessionLogs(session.id),
    enabled: isExpanded,
  })

  const duration = calculateDuration(session.started_at!, session.completed_at!)
  const timeLabel = formatTime(session.started_at!)

  // Group logs by exercise
  const exerciseGroups = groupLogsByExercise(logs || [])

  return (
    <Card
      variant={isExpanded ? 'elevated' : 'outlined'}
      clickable
      onClick={() => setIsExpanded(!isExpanded)}
      className={`mb-3 transition-all ${isExpanded ? 'border-l-4 border-blue-500' : ''}`}
    >
      {/* Collapsed Summary */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {session.workout.name}
            </h3>
            <Badge variant="success" size="sm">✓</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{duration}</span>
            <span>•</span>
            <span>{logs?.length || 0} sets</span>
            <span>•</span>
            <span>{timeLabel}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="text-gray-400 hover:text-gray-600 transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {logsLoading ? (
            <div className="text-center py-8">
              <Spinner size="md" />
            </div>
          ) : exerciseGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No sets logged</p>
          ) : (
            <div className="space-y-4">
              {exerciseGroups.map((group, idx) => (
                <ExerciseLogGroup key={idx} group={group} />
              ))}

              {/* Session Notes */}
              {session.notes && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Session Notes:
                  </h4>
                  <p className="text-sm text-gray-600">{session.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Exercise Log Group Component
interface ExerciseLogGroupProps {
  group: {
    exerciseName: string
    supersetGroup: string | null
    logs: (ExerciseLog & {
      exercise_card: ExerciseCard
    })[]
  }
}

function ExerciseLogGroup({ group }: ExerciseLogGroupProps) {
  return (
    <div className="ml-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        {group.supersetGroup && (
          <span className="text-blue-600 mr-1">{group.supersetGroup}.</span>
        )}
        {group.exerciseName}
      </h4>
      <div className="space-y-1 ml-4">
        {group.logs.map((log, idx) => (
          <div key={log.id} className="text-sm text-gray-700">
            <span className="font-medium">Set {idx + 1}:</span>{' '}
            {formatSetDetails(log)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper Functions

function calculateDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt)
  const end = new Date(completedAt)
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000)

  if (diffMinutes < 60) {
    return `${diffMinutes} min`
  }
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function groupLogsByExercise(
  logs: (ExerciseLog & {
    workout_exercise: {
      exercise_card: ExerciseCard
      superset_group: string | null
    }
  })[]
) {
  const groups: {
    exerciseName: string
    supersetGroup: string | null
    logs: (ExerciseLog & {
      exercise_card: ExerciseCard
    })[]
  }[] = []

  logs.forEach((log) => {
    const exerciseName = log.workout_exercise.exercise_card.name
    const supersetGroup = log.workout_exercise.superset_group

    let group = groups.find(
      (g) =>
        g.exerciseName === exerciseName && g.supersetGroup === supersetGroup
    )

    if (!group) {
      group = {
        exerciseName,
        supersetGroup,
        logs: [],
      }
      groups.push(group)
    }

    // Create a new object with exercise_card at the top level
    const { workout_exercise, ...logWithoutWorkoutExercise } = log
    group.logs.push({
      ...logWithoutWorkoutExercise,
      exercise_card: workout_exercise.exercise_card,
    } as ExerciseLog & { exercise_card: ExerciseCard })
  })

  return groups
}

function formatSetDetails(
  log: ExerciseLog & {
    exercise_card: ExerciseCard
  }
): string {
  const parts: string[] = []

  if (log.exercise_card.tracks_weight && log.weight) {
    parts.push(`${log.weight} lbs`)
  }

  if (log.exercise_card.tracks_reps && log.reps) {
    parts.push(`× ${log.reps} reps`)
  }

  if (log.exercise_card.tracks_duration && log.duration_seconds) {
    parts.push(`${log.duration_seconds} sec`)
  }

  let result = parts.join(' ')

  // RPE is always available in the log, regardless of exercise card tracking config
  if (log.rpe) {
    result += ` (RPE ${log.rpe})`
  }

  return result || 'Completed'
}
