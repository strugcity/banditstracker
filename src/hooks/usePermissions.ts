/**
 * Permissions Hook
 *
 * Provides permission checking utilities based on user's role.
 */

import { useAuth } from '@/contexts/AuthContext'
import { ROLE_PERMISSIONS, type Permission, type EffectiveRole } from '@/types/auth'

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { profile, teams, isGlobalAdmin, isTeamAdmin: checkTeamAdmin } = useAuth()

  /**
   * Get user's effective role in context
   *
   * @param teamId - Optional team ID to check role within
   * @returns The user's effective role
   */
  const getEffectiveRole = (teamId?: string): EffectiveRole => {
    if (isGlobalAdmin) return 'global_admin'
    if (teamId && checkTeamAdmin(teamId)) return 'team_admin'
    return 'user'
  }

  /**
   * Check if user has a specific permission
   *
   * @param permission - The permission to check
   * @param teamId - Optional team ID for team-scoped permissions
   * @returns Whether the user has the permission
   */
  const hasPermission = (permission: Permission, teamId?: string): boolean => {
    if (!profile) return false

    const role = getEffectiveRole(teamId)
    return ROLE_PERMISSIONS[role].includes(permission)
  }

  /**
   * Check if user can manage a specific team
   *
   * @param teamId - The team ID to check
   * @returns Whether the user can manage the team
   */
  const canManageTeam = (teamId: string): boolean => {
    return hasPermission('manage_team', teamId)
  }

  /**
   * Check if user can view team members' logs
   *
   * @param teamId - The team ID to check
   * @returns Whether the user can view team logs
   */
  const canViewTeamLogs = (teamId: string): boolean => {
    return hasPermission('view_team_logs', teamId)
  }

  /**
   * Check if user can create/edit programs
   *
   * @param teamId - Optional team ID for team programs
   * @returns Whether the user can manage programs
   */
  const canManagePrograms = (teamId?: string): boolean => {
    return hasPermission('create_programs', teamId)
  }

  /**
   * Check if user can manage global exercises
   *
   * @returns Whether the user can manage global exercises
   */
  const canManageGlobalExercises = (): boolean => {
    return hasPermission('manage_global_exercises')
  }

  /**
   * Get list of teams user is admin of
   *
   * @returns Array of team IDs where user is admin
   */
  const getAdminTeamIds = (): string[] => {
    if (isGlobalAdmin) {
      return teams.map((t) => t.team_id)
    }
    return teams.filter((t) => t.role === 'admin').map((t) => t.team_id)
  }

  return {
    getEffectiveRole,
    hasPermission,
    canManageTeam,
    canViewTeamLogs,
    canManagePrograms,
    canManageGlobalExercises,
    getAdminTeamIds,
  }
}
