/**
 * Authentication and Authorization Type Definitions
 *
 * Types for user profiles, teams, team membership, and role-based access control.
 */

// ============================================================================
// ENUMS & ROLE TYPES
// ============================================================================

/**
 * Team member role within a team
 */
export type TeamRole = 'admin' | 'user'

/**
 * Effective role considering global admin status
 */
export type EffectiveRole = 'global_admin' | 'team_admin' | 'user'

/**
 * Permission types for role-based access control
 */
export type Permission =
  | 'manage_all_teams'
  | 'manage_team'
  | 'manage_team_members'
  | 'create_programs'
  | 'edit_programs'
  | 'delete_programs'
  | 'assign_workouts'
  | 'view_team_logs'
  | 'view_own_logs'
  | 'log_workouts'
  | 'manage_global_exercises'
  | 'manage_team_exercises'
  | 'manage_own_exercises'

/**
 * Program visibility options
 */
export type ProgramVisibility = 'private' | 'team' | 'public'

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * User profile linked to Supabase Auth
 */
export interface Profile {
  /** UUID from auth.users */
  id: string
  /** User email address */
  email: string
  /** User's full display name */
  full_name: string | null
  /** URL to user's avatar image */
  avatar_url: string | null
  /** Whether user has global admin privileges */
  is_global_admin: boolean
  /** Timestamp when profile was created */
  created_at: string
  /** Timestamp when profile was last updated */
  updated_at: string
}

/**
 * Team/Organization
 */
export interface Team {
  /** UUID primary key */
  id: string
  /** Team display name */
  name: string
  /** Team description */
  description: string | null
  /** Sport type (e.g., "Baseball", "Basketball") */
  sport: string | null
  /** Unique invite code for joining */
  invite_code: string | null
  /** UUID of user who created the team */
  created_by: string
  /** Timestamp when team was created */
  created_at: string
  /** Timestamp when team was last updated */
  updated_at: string
}

/**
 * Team membership record
 */
export interface TeamMember {
  /** UUID primary key */
  id: string
  /** Reference to team */
  team_id: string
  /** Reference to user profile */
  user_id: string
  /** Member's role in the team */
  role: TeamRole
  /** Timestamp when member joined */
  joined_at: string
  /** UUID of user who invited this member (null if joined via code) */
  invited_by: string | null
}

// ============================================================================
// EXTENDED INTERFACES
// ============================================================================

/**
 * Team membership with team details (for user's team list)
 */
export interface TeamMembership {
  /** Team UUID */
  team_id: string
  /** Team display name */
  team_name: string
  /** Team sport */
  team_sport: string | null
  /** User's role in this team */
  role: TeamRole
}

/**
 * Team with its members (for team management)
 */
export interface TeamWithMembers extends Team {
  /** Array of team members with profile details */
  members: (TeamMember & { profile: Profile })[]
}

/**
 * Profile with team memberships (for user context)
 */
export interface ProfileWithTeams extends Profile {
  /** Array of team memberships */
  team_memberships: (TeamMember & { team: Team })[]
}

/**
 * Team member with profile details (for member lists)
 */
export interface TeamMemberWithProfile extends TeamMember {
  /** Member's profile */
  profile: Profile
}

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

/**
 * Auth context state
 */
export interface AuthState {
  /** Supabase auth user (null if not authenticated) */
  user: import('@supabase/supabase-js').User | null
  /** User profile from profiles table */
  profile: Profile | null
  /** User's team memberships */
  teams: TeamMembership[]
  /** Supabase session */
  session: import('@supabase/supabase-js').Session | null
  /** Whether auth state is loading */
  loading: boolean
  /** Whether user is a global admin */
  isGlobalAdmin: boolean
}

/**
 * Auth context methods
 */
export interface AuthMethods {
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>
  /** Sign up with email, password, and name */
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  /** Sign out current user */
  signOut: () => Promise<void>
  /** Send password reset email */
  resetPassword: (email: string) => Promise<void>
  /** Refresh user profile and teams */
  refreshProfile: () => Promise<void>
  /** Check if user is admin of a specific team */
  isTeamAdmin: (teamId: string) => boolean
  /** Check if user has access to a specific team */
  hasTeamAccess: (teamId: string) => boolean
}

/**
 * Complete auth context type
 */
export interface AuthContextType extends AuthState, AuthMethods {}

// ============================================================================
// PERMISSION MAPPING
// ============================================================================

/**
 * Permissions granted to each role
 */
export const ROLE_PERMISSIONS: Record<EffectiveRole, Permission[]> = {
  global_admin: [
    'manage_all_teams',
    'manage_team',
    'manage_team_members',
    'create_programs',
    'edit_programs',
    'delete_programs',
    'assign_workouts',
    'view_team_logs',
    'view_own_logs',
    'log_workouts',
    'manage_global_exercises',
    'manage_team_exercises',
    'manage_own_exercises',
  ],
  team_admin: [
    'manage_team',
    'manage_team_members',
    'create_programs',
    'edit_programs',
    'delete_programs',
    'assign_workouts',
    'view_team_logs',
    'view_own_logs',
    'log_workouts',
    'manage_team_exercises',
    'manage_own_exercises',
  ],
  user: [
    'view_own_logs',
    'log_workouts',
    'manage_own_exercises',
  ],
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

/**
 * Sign in form data
 */
export interface SignInInput {
  email: string
  password: string
}

/**
 * Sign up form data
 */
export interface SignUpInput {
  email: string
  password: string
  fullName: string
}

/**
 * Create team form data
 */
export interface CreateTeamInput {
  name: string
  description?: string
  sport?: string
}

/**
 * Update profile form data
 */
export interface UpdateProfileInput {
  full_name?: string
  avatar_url?: string
}

/**
 * Join team form data
 */
export interface JoinTeamInput {
  inviteCode: string
}
