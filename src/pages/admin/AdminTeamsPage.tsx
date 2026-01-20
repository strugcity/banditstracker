/**
 * Admin Teams Page
 *
 * Global admin view of all teams with create functionality.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllTeams, createTeam } from '@/services/team'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function AdminTeamsPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [newTeamSport, setNewTeamSport] = useState('')

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => getAllTeams(100),
  })

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] })
      setShowCreateForm(false)
      setNewTeamName('')
      setNewTeamDescription('')
      setNewTeamSport('')
    },
  })

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    createTeamMutation.mutate({
      name: newTeamName.trim(),
      description: newTeamDescription.trim() || undefined,
      sport: newTeamSport.trim() || undefined,
    })
  }

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/admin"
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
          >
            &larr; Back to admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">All Teams</h1>
          <p className="text-gray-500">{teams?.length || 0} teams</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>+ Create Team</Button>
      </div>

      {/* Create Team Form */}
      {showCreateForm && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <Input
              label="Team Name"
              placeholder="Enter team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
            <Input
              label="Sport (optional)"
              placeholder="e.g., Baseball, Basketball"
              value={newTeamSport}
              onChange={(e) => setNewTeamSport(e.target.value)}
            />
            <Input
              label="Description (optional)"
              placeholder="Brief description of the team"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
            />
            {createTeamMutation.isError && (
              <p className="text-sm text-red-600">
                Error creating team. Please try again.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" loading={createTeamMutation.isPending}>
                Create Team
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Teams List */}
      {teams && teams.length > 0 ? (
        <div className="space-y-3">
          {teams.map((team) => (
            <Link key={team.id} to={`/team/${team.id}`}>
              <Card clickable className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {team.sport && (
                        <Badge variant="info" size="sm">
                          {team.sport}
                        </Badge>
                      )}
                      {team.invite_code && (
                        <Badge variant="default" size="sm">
                          Code: {team.invite_code}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        Created{' '}
                        {new Date(team.created_at).toLocaleDateString()}
                      </span>
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
                {team.description && (
                  <p className="text-sm text-gray-600 mt-2">{team.description}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No teams yet</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Your First Team
          </Button>
        </Card>
      )}
    </div>
  )
}
