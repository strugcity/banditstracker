/**
 * Video Review Page
 *
 * Review AI-extracted exercises from a video analysis session before importing
 * to the exercise library.
 *
 * Features:
 * - Display all extracted exercises
 * - Select/deselect exercises for import
 * - Select all / deselect all
 * - Import selected exercises to library
 * - Show video metadata
 * - Responsive design
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Badge } from '@/components/common'
import { ExerciseReviewCard } from '@/components/admin/ExerciseReviewCard'

interface VideoAnalysisSession {
  id: string
  video_url: string
  video_title: string
  sport: string | null
  total_duration: string
  analysis_result: {
    video_title: string
    sport?: string
    total_duration: string
    exercises: Array<{
      name: string
      start_time: string
      end_time: string
      instructions: string[]
      coaching_cues: string[]
      screenshot_timestamps: string[]
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      equipment: string[]
    }>
  }
  status: string
  created_at: string
}

export function VideoReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<VideoAnalysisSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      if (!sessionId) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('video_analysis_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (error) throw error
        if (!data) throw new Error('Session not found')

        setSession(data)

        // Select all exercises by default
        const allIndices = data.analysis_result.exercises.map((_, index) => index)
        setSelectedIndices(allIndices)
      } catch (err: any) {
        console.error('Error fetching session:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  const handleToggle = (index: number) => {
    setSelectedIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleSelectAll = () => {
    if (!session) return
    const allIndices = session.analysis_result.exercises.map((_, index) => index)
    setSelectedIndices(allIndices)
  }

  const handleDeselectAll = () => {
    setSelectedIndices([])
  }

  const handleImport = async () => {
    if (!session || selectedIndices.length === 0) return

    try {
      setImporting(true)
      setError(null)

      // Call import-to-library Edge Function
      const { data, error } = await supabase.functions.invoke('import-to-library', {
        body: {
          sessionId: session.id,
          exerciseIndices: selectedIndices
        }
      })

      if (error) throw error

      // Show success message and navigate back to exercises page
      alert(`Successfully imported ${data.inserted} new and updated ${data.updated} existing exercises!`)
      navigate('/exercises') // Navigate back to exercise library page
    } catch (err: any) {
      console.error('Error importing exercises:', err)
      setError(err.message || 'Failed to import exercises')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error || 'Session not found'}</p>
          <Button
            onClick={() => navigate('/admin')}
            className="mt-4"
          >
            Back to Admin
          </Button>
        </div>
      </div>
    )
  }

  const exercises = session.analysis_result.exercises
  const selectedCount = selectedIndices.length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/exercises')}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Exercises
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Review Extracted Exercises
          </h1>
        </div>

        {/* Video Info Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {session.video_title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {session.sport && (
              <Badge className="bg-blue-100 text-blue-800">
                {session.sport}
              </Badge>
            )}
            <Badge className="bg-gray-100 text-gray-700">
              Duration: {session.total_duration}
            </Badge>
            <Badge className="bg-gray-100 text-gray-700">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <a
            href={session.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            View original video →
          </a>
        </div>

        {/* Selection Controls */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{selectedCount}</span> of{' '}
            <span className="font-semibold">{exercises.length}</span> selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedCount === exercises.length}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={selectedCount === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <ExerciseReviewCard
              key={index}
              exercise={exercise}
              index={index}
              isSelected={selectedIndices.includes(index)}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Import Button */}
        <div className="mt-6 sticky bottom-0 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedCount === 0
                ? 'Select exercises to import'
                : `Ready to import ${selectedCount} exercise${selectedCount !== 1 ? 's' : ''}`}
            </p>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || importing}
              className="min-w-[120px]"
            >
              {importing ? 'Importing...' : 'Import to Library'}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
