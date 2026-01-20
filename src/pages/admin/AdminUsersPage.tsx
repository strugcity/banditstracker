/**
 * Admin Users Page
 *
 * Global admin view of all users with invite functionality.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllProfiles, setGlobalAdmin } from '@/services/auth'
import { getAllTeams, addMember } from '@/services/team'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { useAuth } from '@/hooks/useAuth'

export function AdminUsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [addingToTeam, setAddingToTeam] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAllProfiles(100),
  })

  const { data: teams } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => getAllTeams(100),
  })

  const toggleAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      setGlobalAdmin(userId, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const addToTeamMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      addMember(teamId, userId, 'user'),
    onSuccess: () => {
      setAddingToTeam(null)
      setSelectedTeam('')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const handleToggleAdmin = (userId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? 'remove admin rights from' : 'grant admin rights to'
    if (confirm(`${action} ${name}?`)) {
      toggleAdminMutation.mutate({ userId, isAdmin: !currentStatus })
    }
  }

  const handleCopySignupUrl = () => {
    const url = `${window.location.origin}/register`
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleAddToTeam = (userId: string) => {
    if (!selectedTeam) return
    addToTeamMutation.mutate({ teamId: selectedTeam, userId })
  }

  return (
    <div className="container-safe py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin"
          className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
        >
          &larr; Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-500">{users?.length || 0} users</p>
      </div>

      {/* Invite Users Card */}
      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-2">Invite New Users</h2>
        <p className="text-sm text-gray-600 mb-3">
          Share the signup link with new users. They can create an account and then be added to teams.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-700 truncate">
            {window.location.origin}/register
          </code>
          <Button onClick={handleCopySignupUrl} variant="outline" size="sm">
            {copiedUrl ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: After users register, you can add them to teams or make them admins from this page.
        </p>
      </Card>

      {/* Users List */}
      <Card>
        <div className="divide-y">
          {users?.map((profile) => {
            const isCurrentUser = profile.id === user?.id
            const displayName = profile.full_name || profile.email

            return (
              <div key={profile.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {displayName}
                        {isCurrentUser && (
                          <span className="text-gray-400 text-sm ml-2">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin Badge */}
                    {profile.is_global_admin && (
                      <Badge variant="info" size="sm">
                        Global Admin
                      </Badge>
                    )}

                    {/* Add to Team Button */}
                    {!isCurrentUser && teams && teams.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddingToTeam(addingToTeam === profile.id ? null : profile.id)}
                      >
                        Add to Team
                      </Button>
                    )}

                    {/* Toggle Admin (not for current user) */}
                    {!isCurrentUser && (
                      <Button
                        variant={profile.is_global_admin ? 'outline' : 'ghost'}
                        size="sm"
                        loading={toggleAdminMutation.isPending}
                        onClick={() =>
                          handleToggleAdmin(
                            profile.id,
                            profile.is_global_admin,
                            displayName
                          )
                        }
                      >
                        {profile.is_global_admin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Add to Team Form */}
                {addingToTeam === profile.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Add {displayName} to team:</p>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                      >
                        <option value="">Select a team...</option>
                        {teams?.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!selectedTeam}
                        loading={addToTeamMutation.isPending}
                        onClick={() => handleAddToTeam(profile.id)}
                      >
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingToTeam(null)
                          setSelectedTeam('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    {addToTeamMutation.isError && (
                      <p className="text-sm text-red-600 mt-2">
                        Failed to add user to team. They may already be a member.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
