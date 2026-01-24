/**
 * History Page Component
 *
 * Shows workout history and past performance
 * Features:
 * - Chronological list of completed workouts
 * - Expandable session details
 * - Grouped by date (Today, Yesterday, etc.)
 */

import { useQuery } from '@tanstack/react-query'
import { getWorkoutHistory } from '@/lib/queries'
import type { WorkoutSession, Workout } from '@/lib/types'
import { EmptyState, Card } from '@/components/common'
import { SessionCard } from '@/components/history/SessionCard'
import { useAuth } from '@/hooks/useAuth'

export function HistoryPage() {
  const { user } = useAuth()

  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workout-history', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated')
      return getWorkoutHistory(user.id, 50)
    },
    enabled: !!user, // Only run query if user exists
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Workout History
        </h1>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Workout History
        </h1>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : 'Failed to load workout history'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Workout History
        </h1>
        <EmptyState
          title="No Workouts Completed Yet"
          message="Start tracking your training by completing your first workout. Your workout history will appear here."
          icon="📊"
          action={{
            label: 'View Programs',
            onClick: () => (window.location.href = '/programs'),
          }}
        />
      </div>
    )
  }

  // Group sessions by date
  const groupedSessions = groupSessionsByDate(sessions)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Workout History</h1>
        <div className="text-sm text-gray-600">
          {sessions.length} {sessions.length === 1 ? 'workout' : 'workouts'}
        </div>
      </div>

      <div className="space-y-6">
        {groupedSessions.map((group) => (
          <div key={group.label}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">
              {group.label}
            </h2>
            <div className="space-y-3">
              {group.sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// Helper function to group sessions by date
function groupSessionsByDate(
  sessions: (WorkoutSession & { workout: Workout })[]
) {
  const groups: {
    label: string
    sessions: typeof sessions
  }[] = []

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay()) // Start of this week (Sunday)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const todaySessions: typeof sessions = []
  const yesterdaySessions: typeof sessions = []
  const thisWeekSessions: typeof sessions = []
  const lastWeekSessions: typeof sessions = []
  const olderSessions: typeof sessions = []

  sessions.forEach((session) => {
    if (!session.completed_at) return

    const sessionDate = new Date(session.completed_at)

    if (sessionDate.toDateString() === today.toDateString()) {
      todaySessions.push(session)
    } else if (sessionDate.toDateString() === yesterday.toDateString()) {
      yesterdaySessions.push(session)
    } else if (sessionDate >= thisWeekStart) {
      thisWeekSessions.push(session)
    } else if (sessionDate >= lastWeekStart) {
      lastWeekSessions.push(session)
    } else {
      olderSessions.push(session)
    }
  })

  if (todaySessions.length > 0) {
    groups.push({ label: 'Today', sessions: todaySessions })
  }
  if (yesterdaySessions.length > 0) {
    groups.push({ label: 'Yesterday', sessions: yesterdaySessions })
  }
  if (thisWeekSessions.length > 0) {
    groups.push({ label: 'This Week', sessions: thisWeekSessions })
  }
  if (lastWeekSessions.length > 0) {
    groups.push({ label: 'Last Week', sessions: lastWeekSessions })
  }
  if (olderSessions.length > 0) {
    groups.push({ label: 'Older', sessions: olderSessions })
  }

  return groups
}
