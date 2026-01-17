/**
 * Dashboard Page (New Home Page)
 *
 * User landing page / dashboard
 * Features:
 * - Welcome message
 * - Quick stats (workouts this week, etc.)
 * - Recent activity
 * - Quick links to programs
 */

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAllPrograms } from '@/lib/queries'
import { Card, Spinner, Button } from '@/components/common'

export function DashboardPage() {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: getAllPrograms,
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Bandits Tracker
        </h1>
        <p className="text-lg text-gray-600">
          Your mobile-first workout companion
        </p>
      </div>

      {/* Quick Stats Section (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Workouts This Week</div>
          </div>
        </Card>
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </div>
        </Card>
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
        </Card>
      </div>

      {/* Programs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Programs</h2>
          <Link to="/programs">
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Spinner size="lg" />
          </div>
        ) : !programs || programs.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Programs Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Contact your coach to get started with a training program
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.slice(0, 3).map((program) => (
              <Link key={program.id} to={`/programs/${program.id}`}>
                <Card variant="outlined" clickable>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {program.name}
                  </h3>
                  {program.sport && program.season && (
                    <p className="text-sm text-gray-600">
                      {program.sport} • {program.season}
                    </p>
                  )}
                  {program.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/history">
            <Card variant="outlined" clickable>
              <div className="flex items-center">
                <div className="text-4xl mr-4">📊</div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    View History
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review past workouts and progress
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/exercises">
            <Card variant="outlined" clickable>
              <div className="flex items-center">
                <div className="text-4xl mr-4">💪</div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    Exercise Library
                  </h3>
                  <p className="text-sm text-gray-600">
                    Browse exercises with videos
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
