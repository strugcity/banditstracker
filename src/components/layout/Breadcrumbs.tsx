/**
 * Breadcrumbs Component
 *
 * Shows the current page hierarchy for easy navigation
 * Features:
 * - Auto-generates from route path
 * - Clickable parent links
 * - Mobile-friendly compact design
 */

import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutById, getProgramById } from '@/lib/queries'

interface Breadcrumb {
  label: string
  path: string
}

export function Breadcrumbs() {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  // Extract IDs from path
  const workoutId = pathSegments[0] === 'workout' ? pathSegments[1] : null
  const programId = pathSegments[0] === 'program' ? pathSegments[1] : null

  // Fetch workout data if on workout page
  const { data: workout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => getWorkoutById(workoutId!),
    enabled: !!workoutId,
  })

  // Fetch program data if needed
  const { data: program } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => getProgramById(programId!),
    enabled: !!programId,
  })

  // Build breadcrumb trail
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', path: '/' },
  ]

  // Add dynamic breadcrumbs based on route
  if (pathSegments[0] === 'workout' && workout) {
    breadcrumbs.push({
      label: workout.name,
      path: `/workout/${workout.id}`,
    })
  } else if (pathSegments[0] === 'program' && program) {
    breadcrumbs.push({
      label: program.name,
      path: `/program/${program.id}`,
    })
  } else if (pathSegments[0] === 'history') {
    breadcrumbs.push({
      label: 'History',
      path: '/history',
    })
  } else if (pathSegments[0] === 'programs') {
    breadcrumbs.push({
      label: 'Programs',
      path: '/programs',
    })
  } else if (pathSegments[0] === 'exercises') {
    breadcrumbs.push({
      label: 'Exercises',
      path: '/exercises',
    })
  } else if (pathSegments[0] === 'components-test') {
    breadcrumbs.push({
      label: 'Components Test',
      path: '/components-test',
    })
  }

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length === 1) {
    return null
  }

  return (
    <nav className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <li key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400 mx-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}

                {isLast ? (
                  <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
