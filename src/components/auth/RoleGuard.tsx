/**
 * Role Guard Component
 *
 * Restricts access to routes based on user role.
 * Use within ProtectedRoute to add role-based access control.
 *
 * ⚠️ SECURITY NOTICE - CLIENT-SIDE ONLY (UX):
 * ============================================
 * This component provides USER EXPERIENCE protection only. It prevents users
 * from seeing UI they shouldn't access, but does NOT provide security.
 *
 * REAL SECURITY is enforced by:
 * 1. **Supabase Row Level Security (RLS) Policies** - Server-side database policies
 *    that prevent unauthorized data access regardless of client-side code
 * 2. **Supabase Auth** - Session validation and user authentication
 *
 * A malicious user can:
 * - Modify React state to bypass this component
 * - Directly call Supabase queries from browser console
 * - Make API requests outside of the UI
 *
 * However, RLS policies WILL BLOCK unauthorized data access in all cases.
 *
 * DEFENSE IN DEPTH:
 * - Client-side guards (this component) = UX layer (prevent confusion)
 * - RLS policies = Security layer (prevent actual data breaches)
 *
 * See: supabase/migrations/ for RLS policy implementations
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
