/**
 * Exercises Page Component
 *
 * Shows exercise library with videos and instructions
 * (Placeholder for future implementation)
 */

import { EmptyState } from '@/components/common'

export function ExercisesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Exercise Library</h1>
      <EmptyState
        title="Exercise Library Coming Soon"
        message="Browse exercises with video demos, instructions, and coaching cues."
        icon="💪"
      />
    </div>
  )
}
