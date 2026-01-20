/**
 * Team Athletes Page
 *
 * View all athletes in the team and their progress.
 */

import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTeamAthletes } from '@/services/team'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'

export function TeamAthletesPage() {
  const { teamId } = useParams<{ teamId: string }>()

  const { data: athletes, isLoading } = useQuery({
    queryKey: ['team-athletes', teamId],
    queryFn: () => getTeamAthletes(teamId!, 'user'),
    enabled: !!teamId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container-safe py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/team/${teamId}`}
          className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
        >
          &larr; Back to team
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
        <p className="text-gray-500">
          {athletes?.length || 0} athlete{athletes?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Athletes List */}
      {athletes && athletes.length > 0 ? (
        <div className="grid gap-4">
          {athletes.map((athlete) => {
            const displayName =
              athlete.profile?.full_name || athlete.profile?.email || 'Unknown'

            return (
              <Link key={athlete.id} to={`/team/${teamId}/athletes/${athlete.user_id}`}>
                <Card clickable className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {athlete.profile?.avatar_url ? (
                        <img
                          src={athlete.profile.avatar_url}
                          alt={displayName}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-lg">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{displayName}</p>
                        <p className="text-sm text-gray-500">
                          Joined{' '}
                          {new Date(athlete.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
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
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No athletes yet
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Share your team invite code with athletes to let them join your team.
          </p>
        </Card>
      )}
    </div>
  )
}
