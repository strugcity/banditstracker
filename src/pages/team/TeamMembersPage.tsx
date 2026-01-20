/**
 * Team Members Page
 *
 * Manage team members and their roles.
 */

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeamWithMembers,
  updateMemberRole,
  removeMember,
  regenerateInviteCode,
} from '@/services/team'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import type { TeamRole } from '@/types/auth'

export function TeamMembersPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showInviteCode, setShowInviteCode] = useState(false)

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamWithMembers(teamId!),
    enabled: !!teamId,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: TeamRole }) =>
      updateMemberRole(teamId!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(teamId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })

  const regenerateCodeMutation = useMutation({
    mutationFn: () => regenerateInviteCode(teamId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="container-safe py-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">Team not found</p>
        </Card>
      </div>
    )
  }

  const handleRoleChange = (userId: string, newRole: TeamRole) => {
    if (confirm(`Change this member's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, role: newRole })
    }
  }

  const handleRemove = (userId: string, name: string) => {
    if (confirm(`Remove ${name} from the team?`)) {
      removeMemberMutation.mutate(userId)
    }
  }

  return (
    <div className="container-safe py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to={`/team/${teamId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
          >
            &larr; Back to team
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500">{team.name}</p>
        </div>
      </div>

      {/* Invite Code Section */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Invite Code</p>
            <p className="text-sm text-gray-500">
              Share this code with athletes to let them join
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showInviteCode ? (
              <span className="font-mono text-lg font-semibold tracking-wider">
                {team.invite_code}
              </span>
            ) : (
              <span className="text-gray-400">********</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInviteCode(!showInviteCode)}
            >
              {showInviteCode ? 'Hide' : 'Show'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (team.invite_code) {
                  navigator.clipboard.writeText(team.invite_code)
                  alert('Copied!')
                }
              }}
            >
              Copy
            </Button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            loading={regenerateCodeMutation.isPending}
            onClick={() => {
              if (confirm('Generate a new invite code? The old code will stop working.')) {
                regenerateCodeMutation.mutate()
              }
            }}
          >
            Regenerate Code
          </Button>
        </div>
      </Card>

      {/* Members List */}
      <Card>
        <div className="divide-y">
          {team.members.map((member) => {
            const isCurrentUser = member.user_id === user?.id
            const displayName = member.profile?.full_name || member.profile?.email || 'Unknown'

            return (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {member.profile?.avatar_url ? (
                    <img
                      src={member.profile.avatar_url}
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
                    <p className="text-sm text-gray-500">{member.profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Badge */}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      member.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </span>

                  {/* Actions (not for current user) */}
                  {!isCurrentUser && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRoleChange(
                            member.user_id,
                            member.role === 'admin' ? 'user' : 'admin'
                          )
                        }
                      >
                        {member.role === 'admin' ? 'Demote' : 'Promote'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleRemove(member.user_id, displayName)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
