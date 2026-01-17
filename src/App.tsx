import { Routes, Route, Link, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WorkoutPage from './pages/WorkoutPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  const location = useLocation()

  // Determine active tab
  const isHomeActive = location.pathname === '/'
  const isHistoryActive = location.pathname === '/history'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content area with bottom padding for navigation */}
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout/:workoutId" element={<WorkoutPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {/* Workouts Tab */}
            <Link
              to="/"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors select-none ${
                isHomeActive ? 'text-blue-600' : 'text-gray-600'
              }`}
              aria-label="Workouts"
            >
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs font-medium">Workouts</span>
            </Link>

            {/* History Tab */}
            <Link
              to="/history"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors select-none ${
                isHistoryActive ? 'text-blue-600' : 'text-gray-600'
              }`}
              aria-label="History"
            >
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-medium">History</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default App
