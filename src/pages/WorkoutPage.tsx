import { useParams } from 'react-router-dom'

export default function WorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>()

  return (
    <div className="container-safe py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-bandits-primary mb-2">
          Active Workout
        </h1>
        <p className="text-gray-600">
          Workout ID: {workoutId}
        </p>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Workout Logging
          </h2>
          <p className="text-gray-600">
            Workout page content coming soon...
          </p>
        </div>
      </main>
    </div>
  )
}
