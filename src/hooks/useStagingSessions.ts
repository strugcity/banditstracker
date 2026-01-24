/**
 * Hook for managing video analysis staging sessions
 *
 * Provides:
 * - Count of open sessions
 * - Whether user can create new sessions (< 3 open)
 * - List of open sessions
 * - Refresh function
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { VideoAnalysisSession, UseStagingSessionsReturn } from '@/types/staging'

export function useStagingSessions(): UseStagingSessionsReturn {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<VideoAnalysisSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('video_analysis_sessions')
        .select('*')
        .eq('owner_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .gt('expires_at', now)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching staging sessions:', error)
        setSessions([])
      } else {
        setSessions((data as VideoAnalysisSession[]) || [])
      }
    } catch (err) {
      console.error('Error fetching staging sessions:', err)
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Refresh function
  const refetch = useCallback(() => {
    fetchSessions()
  }, [fetchSessions])

  return {
    openSessionCount: sessions.length,
    canCreateNewSession: sessions.length < 3,
    sessions,
    isLoading,
    refetch,
  }
}
