/**
 * Join Team Page
 *
 * Page for joining a team using an invite code.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { joinTeamByCode, getTeamByInviteCode } from '@/services/team'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'

export function JoinTeamPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamPreview, setTeamPreview] = useState<{
    id: string
    name: string
    sport: string | null
  } | null>(null)

  // Look up team when code changes
  const handleCodeChange = async (code: string) => {
    setInviteCode(code.toUpperCase())
    setError(null)
    setTeamPreview(null)

    if (code.length >= 8) {
      try {
        const team = await getTeamByInviteCode(code)
        if (team) {
          setTeamPreview(team)
        }
      } catch {
        // Silently fail preview lookup
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await joinTeamByCode(inviteCode)
      await refreshProfile()
      navigate('/profile')
    } catch (err: any) {
      if (err.message?.includes('Invalid invite code')) {
        setError('Invalid invite code. Please check and try again.')
      } else if (err.message?.includes('Already a member')) {
        setError('You are already a member of this team.')
      } else {
        setError(err.message || 'Failed to join team. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-safe py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Join a Team</h1>

      <div className="max-w-md">
        <Card className="p-6">
          <p className="text-gray-600 mb-6">
            Enter the invite code provided by your coach or team administrator to
            join their team.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Invite Code Input */}
            <Input
              label="Invite Code"
              type="text"
              value={inviteCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="XXXXXXXX"
              maxLength={20}
              className="font-mono text-lg tracking-wider"
              autoFocus
            />

            {/* Team Preview */}
            {teamPreview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Team found:</p>
                <p className="font-semibold text-blue-900">{teamPreview.name}</p>
                {teamPreview.sport && (
                  <p className="text-sm text-blue-700">{teamPreview.sport}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={inviteCode.length < 8}
            >
              Join Team
            </Button>
          </form>
        </Card>

        {/* Create Team Option */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Want to create your own team?{' '}
            <button
              onClick={() => navigate('/team/create')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create a team
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
