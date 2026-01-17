/**
 * Programs Page Component
 *
 * Shows all training programs and allows program management
 * (Placeholder for future implementation)
 */

import { EmptyState } from '@/components/common'

export function ProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Training Programs</h1>
      <EmptyState
        title="Programs Coming Soon"
        message="Manage your training programs, view program details, and create new programs."
        icon="📋"
      />
    </div>
  )
}
