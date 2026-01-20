/**
 * Role Guard Component
 *
 * Restricts access to routes based on user role.
 * Use within ProtectedRoute to add role-based access control.
 */

import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { EffectiveRole } from '@/types/auth'

interface RoleGuardProps {
  /**
   * Required role(s) to access the route.
   * Can be a single role or array of roles (any match grants access).
   */
  requiredRole: EffectiveRole | EffectiveRole[]
  /**
   * Where to redirect if access denied.
   * Defaults to home page.
   */
  redirectTo?: string
}

export function RoleGuard({ requiredRole, redirectTo = '/' }: RoleGuardProps) {
  const { isGlobalAdmin, isTeamAdmin } = useAuth()
  const { teamId } = useParams<{ teamId?: string }>()

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  /**
   * Check if user has any of the required roles
   */
  const hasAccess = roles.some((role) => {
    switch (role) {
      case 'global_admin':
        return isGlobalAdmin
      case 'team_admin':
        // For team_admin, check if user is admin of the team in the URL
        // If no teamId in URL, check if user is admin of any team
        if (teamId) {
          return isTeamAdmin(teamId)
        }
        return false
      case 'user':
        // 'user' role is the baseline - any authenticated user has this
        return true
      default:
        return false
    }
  })

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
