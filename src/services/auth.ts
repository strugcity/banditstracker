/**
 * Authentication Service
 *
 * Functions for managing user authentication with Supabase Auth.
 */

import { supabase } from '@/lib/supabase'
import type { Profile, UpdateProfileInput } from '@/types/auth'

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Sign in with email and password
 *
 * @param email - User email
 * @param password - User password
 * @throws Error if sign in fails
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
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
 *
 * @param email - User email
 * @param password - User password
 * @param fullName - User's full name
 * @throws Error if sign up fails
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<void> {
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
 *
 * @throws Error if sign out fails
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

/**
 * Send password reset email
 *
 * @param email - User email
 * @throws Error if reset fails
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    throw error
  }
}

/**
 * Update user password (when logged in)
 *
 * @param newPassword - New password
 * @throws Error if update fails
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }
}

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Get current user's profile
 *
 * @returns User profile or null if not authenticated
 * @throws Error if query fails
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Get profile by user ID
 *
 * @param userId - User UUID
 * @returns User profile
 * @throws Error if profile not found
 */
export async function getProfileById(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Update current user's profile
 *
 * @param updates - Profile fields to update
 * @returns Updated profile
 * @throws Error if update fails
 */
export async function updateProfile(updates: UpdateProfileInput): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Search profiles by email or name
 *
 * @param query - Search query
 * @param limit - Maximum results
 * @returns Array of matching profiles
 */
export async function searchProfiles(query: string, limit: number = 10): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limit)

  if (error) throw error
  return data as Profile[]
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Set user as global admin (requires current user to be global admin)
 *
 * @param userId - User UUID to promote
 * @param isAdmin - Whether to set or unset admin status
 * @throws Error if not authorized or update fails
 */
export async function setGlobalAdmin(userId: string, isAdmin: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_global_admin: isAdmin })
    .eq('id', userId)

  if (error) throw error
}

/**
 * Get all users (admin only)
 *
 * @param limit - Maximum results
 * @param offset - Pagination offset
 * @returns Array of profiles
 */
export async function getAllProfiles(
  limit: number = 50,
  offset: number = 0
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as Profile[]
}
