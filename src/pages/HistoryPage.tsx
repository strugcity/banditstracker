/**
 * History Page Component
 *
 * Shows workout history and past performance
 * (Placeholder for future implementation)
 */

import { EmptyState } from '@/components/common'

export function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Workout History</h1>
      <EmptyState
        title="History Coming Soon"
        message="View your completed workouts, track progress, and analyze performance trends."
        icon="📊"
      />
    </div>
  )
}
