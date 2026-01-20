/**
 * Athlete Detail Page
 *
 * View an individual athlete's workout history and progress.
 */

import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProfileById } from '@/services/auth'
import { getWorkoutHistory } from '@/lib/queries'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Badge } from '@/components/common/Badge'

export function AthleteDetailPage() {
  const { teamId, athleteId } = useParams<{ teamId: string; athleteId: string }>()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', athleteId],
    queryFn: () => getProfileById(athleteId!),
    enabled: !!athleteId,
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['athlete-history', athleteId],
    queryFn: () => getWorkoutHistory(athleteId, 20),
    enabled: !!athleteId,
  })

  const isLoading = profileLoading || historyLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container-safe py-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">Athlete not found</p>
        </Card>
      </div>
    )
  }

  const displayName = profile.full_name || profile.email || 'Unknown'

  return (
    <div className="container-safe py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/team/${teamId}/athletes`}
          className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
        >
          &larr; Back to athletes
        </Link>

        <div className="flex items-center gap-4 mt-2">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-500">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{history?.length || 0}</p>
          <p className="text-sm text-gray-500">Workouts Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {history && history.length > 0
              ? Math.round(
                  (new Date().getTime() -
                    new Date(history[history.length - 1].completed_at!).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : '-'}
          </p>
          <p className="text-sm text-gray-500">Days Since First</p>
        </Card>
      </div>

      {/* Workout History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Workouts</h2>

      {history && history.length > 0 ? (
        <div className="space-y-3">
          {history.map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {session.workout?.name || 'Workout'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'In progress'}
                  </p>
                </div>
                <Badge variant={session.status === 'completed' ? 'success' : 'warning'}>
                  {session.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
              {session.notes && (
                <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {session.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No workout history yet</p>
        </Card>
      )}
    </div>
  )
}
