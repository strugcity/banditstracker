/**
 * Team Dashboard Page
 *
 * Overview page for team administrators.
 */

import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTeamWithMembers } from '@/services/team'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Button } from '@/components/common/Button'

export function TeamDashboardPage() {
  const { teamId } = useParams<{ teamId: string }>()

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamWithMembers(teamId!),
    enabled: !!teamId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="container-safe py-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">Failed to load team</p>
        </Card>
      </div>
    )
  }

  const adminCount = team.members.filter((m) => m.role === 'admin').length
  const memberCount = team.members.filter((m) => m.role === 'user').length

  return (
    <div className="container-safe py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        {team.sport && <p className="text-gray-500">{team.sport}</p>}
        {team.description && (
          <p className="text-gray-600 mt-2">{team.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{adminCount}</p>
          <p className="text-sm text-gray-500">Coaches</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{memberCount}</p>
          <p className="text-sm text-gray-500">Athletes</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 mb-6">
        <Link to={`/team/${teamId}/members`}>
          <Card clickable className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                <div>
                  <p className="font-medium text-gray-900">Manage Members</p>
                  <p className="text-sm text-gray-500">
                    Add, remove, or change member roles
                  </p>
                </div>
              </div>
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

        <Link to={`/team/${teamId}/athletes`}>
          <Card clickable className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Athletes</p>
                  <p className="text-sm text-gray-500">
                    See workout logs and progress
                  </p>
                </div>
              </div>
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
      </div>

      {/* Invite Code */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Team Invite Code</p>
            <p className="font-mono text-lg font-semibold tracking-wider">
              {team.invite_code || 'No code generated'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (team.invite_code) {
                navigator.clipboard.writeText(team.invite_code)
                alert('Copied to clipboard!')
              }
            }}
          >
            Copy
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Share this code with athletes to let them join your team
        </p>
      </Card>
    </div>
  )
}
