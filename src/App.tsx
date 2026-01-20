import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Button,
  Input,
  Card,
  Select,
  Badge,
  Spinner,
  EmptyState,
} from '@/components/common'
import { Layout } from '@/components/layout'
import { ProtectedRoute, RoleGuard } from '@/components/auth'
import { DashboardPage, ProgramDetailPage, WorkoutPage, HistoryPage, ProgramsPage, ExercisesPage } from '@/pages'
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/auth'
import { ProfilePage } from '@/pages/ProfilePage'
import { JoinTeamPage } from '@/pages/JoinTeamPage'
import { VideoReviewPage } from '@/pages/admin/VideoReviewPage'
import { TeamDashboardPage } from '@/pages/team/TeamDashboardPage'
import { TeamMembersPage } from '@/pages/team/TeamMembersPage'
import { TeamAthletesPage } from '@/pages/team/TeamAthletesPage'
import { AthleteDetailPage } from '@/pages/team/AthleteDetailPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminTeamsPage } from '@/pages/admin/AdminTeamsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes - any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/programs" element={<Layout><ProgramsPage /></Layout>} />
        <Route path="/programs/:programId" element={<Layout><ProgramDetailPage /></Layout>} />
        <Route path="/workout/:workoutId" element={<Layout><WorkoutPage /></Layout>} />
        <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
        <Route path="/exercises" element={<Layout><ExercisesPage /></Layout>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="/join-team" element={<Layout><JoinTeamPage /></Layout>} />
        <Route path="/components-test" element={<Layout><ComponentsTestPage /></Layout>} />

        {/* Team Admin routes */}
        <Route element={<RoleGuard requiredRole="team_admin" />}>
          <Route path="/team/:teamId" element={<Layout><TeamDashboardPage /></Layout>} />
          <Route path="/team/:teamId/members" element={<Layout><TeamMembersPage /></Layout>} />
          <Route path="/team/:teamId/athletes" element={<Layout><TeamAthletesPage /></Layout>} />
          <Route path="/team/:teamId/athletes/:athleteId" element={<Layout><AthleteDetailPage /></Layout>} />
        </Route>

        {/* Global Admin routes */}
        <Route element={<RoleGuard requiredRole="global_admin" />}>
          <Route path="/admin" element={<Layout><AdminDashboardPage /></Layout>} />
          <Route path="/admin/teams" element={<Layout><AdminTeamsPage /></Layout>} />
          <Route path="/admin/users" element={<Layout><AdminUsersPage /></Layout>} />
          <Route path="/admin/video-review/:sessionId" element={<Layout><VideoReviewPage /></Layout>} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Component Testing Page
function ComponentsTestPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [exerciseType, setExerciseType] = useState('')

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert('Form submitted!')
    }, 2000)
  }

  return (
    <div className="container-safe py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          UI Components Test
        </h1>
        <p className="text-gray-600">
          Testing all reusable components from the component library
        </p>
      </header>

      <main className="max-w-2xl mx-auto space-y-8">
        {/* Button Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="space-y-2">
              <Button fullWidth>Full Width</Button>
              <Button loading>Loading...</Button>
            </div>
          </div>
        </Card>

        {/* Input Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Inputs</h2>
          <div className="space-y-4">
            <Input label="Email" type="email" placeholder="Enter your email" />
            <Input
              label="Email with Error"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError || undefined}
              placeholder="test@example.com"
            />
            <Input
              label="Password"
              type="password"
              helperText="Must be at least 8 characters"
            />
            <Input label="Reps" type="number" inputMode="numeric" placeholder="0" />
          </div>
        </Card>

        {/* Card Tests */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Cards</h2>
          <Card variant="default">
            <h3 className="font-semibold">Default Card</h3>
            <p className="text-sm text-gray-600">With default styling</p>
          </Card>
          <Card variant="elevated">
            <h3 className="font-semibold">Elevated Card</h3>
            <p className="text-sm text-gray-600">With shadow elevation</p>
          </Card>
          <Card variant="outlined">
            <h3 className="font-semibold">Outlined Card</h3>
            <p className="text-sm text-gray-600">With border outline</p>
          </Card>
          <Card clickable onClick={() => alert('Card clicked!')}>
            <h3 className="font-semibold">Clickable Card</h3>
            <p className="text-sm text-gray-600">Try clicking me!</p>
          </Card>
        </div>

        {/* Select Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Select</h2>
          <div className="space-y-4">
            <Select
              label="Exercise Type"
              placeholder="Select exercise type..."
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              options={[
                { value: 'push', label: 'Push' },
                { value: 'pull', label: 'Pull' },
                { value: 'legs', label: 'Legs' },
                { value: 'core', label: 'Core' },
              ]}
            />
          </div>
        </Card>

        {/* Badge Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Badges</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" dot>
                With Dot
              </Badge>
              <Badge variant="info" dot size="sm">
                Small Dot
              </Badge>
            </div>
          </div>
        </Card>

        {/* Spinner Tests */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Spinners</h2>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="sm" />
              <span className="text-xs text-gray-600">Small</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-gray-600">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="lg" />
              <span className="text-xs text-gray-600">Large</span>
            </div>
          </div>
        </Card>

        {/* Empty State Tests */}
        <Card padding="none">
          <EmptyState
            title="No workouts yet"
            message="Start tracking your training by adding your first workout."
            action={{
              label: 'Add Workout',
              onClick: () => alert('Add workout clicked!'),
            }}
          />
        </Card>

        {/* Interactive Demo */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError('')
              }}
              error={emailError || undefined}
              placeholder="your@email.com"
            />
            <Select
              label="Exercise Type"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              options={[
                { value: '', label: 'Select...' },
                { value: 'push', label: 'Push' },
                { value: 'pull', label: 'Pull' },
                { value: 'legs', label: 'Legs' },
              ]}
            />
            <Button
              fullWidth
              loading={loading}
              onClick={handleSubmit}
              disabled={!email || !exerciseType}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default App
