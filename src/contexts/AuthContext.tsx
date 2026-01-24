/**
 * Authentication Context Provider
 *
 * Provides authentication state and methods throughout the application.
 * Wraps Supabase Auth and manages user profile and team memberships.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, TeamMembership, AuthContextType } from '@/types/auth'

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [teams, setTeams] = useState<TeamMembership[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Derived state
  const isGlobalAdmin = profile?.is_global_admin ?? false

  /**
   * Fetch user profile from profiles table
   */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as Profile
  }, [])

  /**
   * Fetch user's team memberships
   */
  const fetchTeams = useCallback(async (userId: string): Promise<TeamMembership[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        team:teams(name, sport)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching teams:', error)
      return []
    }

    return (data || []).map((membership: any) => ({
      team_id: membership.team_id,
      team_name: membership.team?.name || 'Unknown Team',
      team_sport: membership.team?.sport || null,
      role: membership.role,
    }))
  }, [])

  /**
   * Refresh profile and teams from database
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return

    const [newProfile, newTeams] = await Promise.all([
      fetchProfile(user.id),
      fetchTeams(user.id),
    ])

    setProfile(newProfile)
    setTeams(newTeams)
  }, [user, fetchProfile, fetchTeams])

  /**
   * Handle auth state changes
   *
   * PERFORMANCE OPTIMIZATION:
   * - Profile and teams are fetched in parallel using Promise.all
   * - Loading state is set immediately after data fetches complete
   * - Auth state listener avoids unnecessary re-fetches when user hasn't changed
   *
   * Note: The waterfall (session → profile+teams) is unavoidable because we need
   * the user ID from the session before we can fetch profile/teams. This is the
   * standard pattern for Supabase Auth integration.
   */
  useEffect(() => {
    let isInitialLoad = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        // Fetch profile and teams in parallel for faster initial load
        Promise.all([
          fetchProfile(initialSession.user.id),
          fetchTeams(initialSession.user.id),
        ]).then(([fetchedProfile, fetchedTeams]) => {
          setProfile(fetchedProfile)
          setTeams(fetchedTeams)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }

      isInitialLoad = false
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Skip processing during initial load (already handled above)
      if (isInitialLoad) return

      const userChanged = user?.id !== newSession?.user?.id

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user && userChanged) {
        // Only re-fetch if user actually changed (optimization)
        const [fetchedProfile, fetchedTeams] = await Promise.all([
          fetchProfile(newSession.user.id),
          fetchTeams(newSession.user.id),
        ])
        setProfile(fetchedProfile)
        setTeams(fetchedTeams)
      } else if (!newSession?.user) {
        // User signed out
        setProfile(null)
        setTeams([])
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, fetchTeams, user?.id])

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }

  /**
   * Sign up with email, password, and full name
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      throw error
    }
  }

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    // Clear local state
    setUser(null)
    setProfile(null)
    setTeams([])
    setSession(null)
  }

  /**
   * Send password reset email
   */
  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw error
    }
  }

  /**
   * Check if current user is admin of a specific team
   */
  const isTeamAdmin = (teamId: string): boolean => {
    if (isGlobalAdmin) return true
    return teams.some((t) => t.team_id === teamId && t.role === 'admin')
  }

  /**
   * Check if current user has access to a specific team
   */
  const hasTeamAccess = (teamId: string): boolean => {
    if (isGlobalAdmin) return true
    return teams.some((t) => t.team_id === teamId)
  }

  // Context value
  const value: AuthContextType = {
    // State
    user,
    profile,
    teams,
    session,
    loading,
    isGlobalAdmin,
    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    isTeamAdmin,
    hasTeamAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access auth context
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export default AuthContext
