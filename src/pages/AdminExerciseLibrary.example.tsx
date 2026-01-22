/**
 * Example Admin Page - Exercise Library Management
 *
 * This is a complete example showing how to integrate the video analysis service
 * into your admin panel. Copy and adapt as needed.
 */

import { useState } from 'react'
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'
import { ExerciseLibraryBrowser } from '@/components/admin/ExerciseLibraryBrowser'
import type { ExerciseCardWithVideo } from '@/types/video-analysis'

export default function AdminExerciseLibrary() {
  const [view, setView] = useState<'add' | 'browse'>('browse')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleVideoAnalysisSuccess = (exercises: any[]) => {
    // Show success notification
    alert(`Successfully added ${exercises.length} exercises to library!`)

    // Switch to browse view
    setView('browse')

    // Refresh the browser to show new exercises
    setRefreshKey((prev) => prev + 1)
  }

  const handleSelectExercise = (exercise: ExerciseCardWithVideo) => {
    console.log('Selected exercise:', exercise)
    // You could:
    // - Open a modal with full details
    // - Navigate to exercise edit page
    // - Add to workout builder
    // - etc.
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
          <p className="text-gray-600 mt-1">
            Manage your exercise library with AI-powered video analysis
          </p>
        </div>
      </header>

      {/* View Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-4">
            <button
              onClick={() => setView('browse')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                view === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse Library
            </button>
            <button
              onClick={() => setView('add')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                view === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Add from Video
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {view === 'add' ? (
          <div className="max-w-3xl mx-auto">
            <VideoAnalysisForm
              onSuccess={handleVideoAnalysisSuccess}
              onError={(error) => {
                alert(`Analysis failed: ${error}`)
              }}
            />

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Quick Start</h3>
              <ol className="space-y-2 text-blue-800 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Find a training video on YouTube (e.g., baseball pitching drills)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Copy the URL and paste it into the form above</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>
                    Select the sport (optional - AI will auto-detect if not specified)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>
                    Click "Analyze Video" and wait ~10-30 seconds for AI to process it
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  <span>
                    The exercises will be automatically added to your library with
                    instructions, coaching cues, and more!
                  </span>
                </li>
              </ol>
            </div>

            {/* Example Videos */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Try These Example Videos</h3>
              <div className="space-y-2">
                <ExampleVideoLink
                  title="Front Squat Technique"
                  url="https://www.youtube.com/watch?v=uYumuL_G_V0"
                  sport="strength"
                />
                <ExampleVideoLink
                  title="Baseball Pitcher Warm-up Routine"
                  url="https://www.youtube.com/watch?v=example"
                  sport="baseball"
                />
                <ExampleVideoLink
                  title="Medicine Ball Explosive Drills"
                  url="https://www.youtube.com/watch?v=example2"
                  sport="power"
                />
              </div>
            </div>
          </div>
        ) : (
          <ExerciseLibraryBrowser
            key={refreshKey}
            onSelectExercise={handleSelectExercise}
            filterByVideo={true}
          />
        )}
      </main>
    </div>
  )
}

/**
 * Helper component for example video links
 */
function ExampleVideoLink({
  title,
  url,
  sport
}: {
  title: string
  url: string
  sport: string
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    alert('URL copied to clipboard!')
  }

  return (
    <button
      onClick={copyToClipboard}
      className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Sport: {sport} • Click to copy URL
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
    </button>
  )
}

/**
 * Alternative Layout: Side-by-Side
 *
 * If you prefer a split-screen layout with both forms visible:
 */
export function AdminExerciseLibrarySideBySide() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCardWithVideo | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Exercise Library Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Add Video */}
          <div>
            <h2 className="text-xl font-bold mb-4">Add New Exercises</h2>
            <VideoAnalysisForm
              onSuccess={(exercises) => {
                alert(`Added ${exercises.length} exercises!`)
              }}
            />
          </div>

          {/* Right: Browse Library */}
          <div>
            <h2 className="text-xl font-bold mb-4">Exercise Library</h2>
            <ExerciseLibraryBrowser onSelectExercise={setSelectedExercise} />
          </div>
        </div>

        {/* Selected Exercise Details (Modal or Bottom Panel) */}
        {selectedExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Exercise details go here */}
              <p className="text-gray-600">Full exercise details...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
