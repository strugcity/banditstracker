/**
 * Profile Page
 *
 * User profile management page.
 */

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/services/auth'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'

export function ProfilePage() {
  const { user, profile, teams, refreshProfile, isGlobalAdmin } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await updateProfile({ full_name: fullName })
      await refreshProfile()
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-safe py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="max-w-lg space-y-6">
        {/* Profile Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your Information</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Profile updated successfully
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed"
            />

            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />

            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Account Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Account created</p>
              <p className="text-gray-900">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>

            {isGlobalAdmin && (
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <span className="inline-block px-2 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded">
                  Global Admin
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Teams */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Teams</h2>

          {teams.length === 0 ? (
            <p className="text-gray-500 text-sm">
              You're not a member of any teams yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {teams.map((team) => (
                <li
                  key={team.team_id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">{team.team_name}</p>
                    {team.team_sport && (
                      <p className="text-sm text-gray-500">{team.team_sport}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      team.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {team.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
