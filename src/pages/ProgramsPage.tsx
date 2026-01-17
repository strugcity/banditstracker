/**
 * Programs Page Component
 *
 * Shows all training programs
 * Features:
 * - Lists all programs with details
 * - Click to view program workouts
 */

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAllPrograms } from '@/lib/queries'
import { Card, Spinner, EmptyState } from '@/components/common'

export function ProgramsPage() {
  const { data: programs, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: getAllPrograms,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Training Programs</h1>
        <div className="text-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Training Programs</h1>
        <Card>
          <div className="text-center py-8">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-gray-600">
              {error instanceof Error ? error.message : 'Failed to load programs'}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (!programs || programs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Training Programs</h1>
        <EmptyState
          title="No Programs Found"
          message="Contact your coach to get started with a training program."
          icon="📋"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Training Programs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <Link key={program.id} to={`/programs/${program.id}`}>
            <Card variant="outlined" clickable className="h-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {program.name}
              </h3>
              {program.sport && program.season && (
                <p className="text-sm text-gray-600 mb-3">
                  {program.sport} • {program.season}
                </p>
              )}
              {program.description && (
                <p className="text-sm text-gray-500">
                  {program.description}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
