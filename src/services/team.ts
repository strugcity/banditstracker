/**
 * Team Service
 *
 * Functions for managing teams and team membership.
 */

import { supabase } from '@/lib/supabase'
import type {
  Team,
  TeamMember,
  TeamMemberWithProfile,
  TeamWithMembers,
  CreateTeamInput,
  TeamRole,
} from '@/types/auth'

// Note: Using 'as any' for tables not yet in generated types (teams, team_members, profiles)
// TODO: Regenerate Supabase types to include new auth tables

// ============================================================================
// TEAM CRUD
// ============================================================================

/**
 * Create a new team (current user becomes admin)
 *
 * @param input - Team creation data
 * @returns Created team ID
 * @throws Error if creation fails
 */
export async function createTeam(input: CreateTeamInput): Promise<string> {
  const { data, error } = await (supabase.rpc as any)('create_team_with_admin', {
    team_name: input.name,
    team_description: input.description || null,
    team_sport: input.sport || null,
  })

  if (error) throw error
  return data as string
}

/**
 * Get team by ID
 *
 * @param teamId - Team UUID
 * @returns Team data
 * @throws Error if team not found
 */
export async function getTeamById(teamId: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (error) throw error
  return data as Team
}

/**
 * Get team with all members
 *
 * @param teamId - Team UUID
 * @returns Team with members array
 * @throws Error if team not found
 */
export async function getTeamWithMembers(teamId: string): Promise<TeamWithMembers> {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (teamError) throw teamError

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (membersError) throw membersError

  return {
    ...(team as Team),
    members: (members || []) as (TeamMember & { profile: any })[],
  }
}

/**
 * Update team details
 *
 * @param teamId - Team UUID
 * @param updates - Fields to update
 * @returns Updated team
 * @throws Error if update fails
 */
export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description' | 'sport'>>
): Promise<Team> {
  const { data, error } = await (supabase
    .from('teams') as any)
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  return data as Team
}

/**
 * Delete a team
 *
 * @param teamId - Team UUID
 * @throws Error if deletion fails
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', teamId)

  if (error) throw error
}

/**
 * Get all teams (admin only)
 *
 * @param limit - Maximum results
 * @param offset - Pagination offset
 * @returns Array of teams
 */
export async function getAllTeams(limit: number = 50, offset: number = 0): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as Team[]
}

// ============================================================================
// TEAM MEMBERSHIP
// ============================================================================

/**
 * Join a team using invite code
 *
 * @param inviteCode - Team invite code
 * @returns Team ID joined
 * @throws Error if code invalid or join fails
 */
export async function joinTeamByCode(inviteCode: string): Promise<string> {
  const { data, error } = await (supabase.rpc as any)('join_team_by_invite_code', {
    code: inviteCode.toUpperCase(),
  })

  if (error) throw error
  return data as string
}

/**
 * Leave a team
 *
 * @param teamId - Team UUID
 * @throws Error if leave fails
 */
export async function leaveTeam(teamId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Get team members
 *
 * @param teamId - Team UUID
 * @returns Array of members with profiles
 */
export async function getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as TeamMemberWithProfile[]
}

/**
 * Update member's role
 *
 * @param teamId - Team UUID
 * @param userId - User UUID
 * @param role - New role
 * @throws Error if update fails
 */
export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole
): Promise<void> {
  const { error } = await (supabase
    .from('team_members') as any)
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Remove member from team
 *
 * @param teamId - Team UUID
 * @param userId - User UUID
 * @throws Error if removal fails
 */
export async function removeMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Add member to team directly (admin only)
 *
 * @param teamId - Team UUID
 * @param userId - User UUID to add
 * @param role - Role to assign
 * @throws Error if add fails
 */
export async function addMember(
  teamId: string,
  userId: string,
  role: TeamRole = 'user'
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await (supabase.from('team_members') as any).insert({
    team_id: teamId,
    user_id: userId,
    role,
    invited_by: user?.id || null,
  })

  if (error) throw error
}

// ============================================================================
// INVITE CODES
// ============================================================================

/**
 * Regenerate team invite code
 *
 * @param teamId - Team UUID
 * @returns New invite code
 * @throws Error if regeneration fails
 */
export async function regenerateInviteCode(teamId: string): Promise<string> {
  const { data, error } = await (supabase.rpc as any)('regenerate_team_invite_code', {
    team_uuid: teamId,
  })

  if (error) throw error
  return data as string
}

/**
 * Get team by invite code (for preview before joining)
 *
 * @param inviteCode - Invite code
 * @returns Team info or null
 */
export async function getTeamByInviteCode(
  inviteCode: string
): Promise<Pick<Team, 'id' | 'name' | 'sport'> | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, sport')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data
}

// ============================================================================
// TEAM QUERIES FOR ATHLETES
// ============================================================================

/**
 * Get users in a team (for team admins to view athletes)
 *
 * @param teamId - Team UUID
 * @param role - Optional role filter
 * @returns Array of members
 */
export async function getTeamAthletes(
  teamId: string,
  role?: TeamRole
): Promise<TeamMemberWithProfile[]> {
  let query = supabase
    .from('team_members')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query

  if (error) throw error
  return data as TeamMemberWithProfile[]
}

/**
 * Get user's teams
 *
 * @returns Array of teams user belongs to
 */
export async function getUserTeams(): Promise<(TeamMember & { team: Team })[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as (TeamMember & { team: Team })[]
}

// ============================================================================
// ADMIN UTILITY FUNCTIONS
// ============================================================================

/**
 * Fix a team by adding its creator as admin (if missing)
 * Only callable by global admins
 *
 * @param teamId - Team UUID to fix
 * @returns Success status
 */
export async function fixTeamCreatorMembership(teamId: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)('add_team_creator_as_admin', {
    team_uuid: teamId,
  })

  if (error) throw error
  return data as boolean
}
