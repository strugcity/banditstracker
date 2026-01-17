import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  )
}

function HomePage() {
  return (
    <div className="container-safe py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-bandits-primary mb-2">
          Bandits Training Tracker
        </h1>
        <p className="text-gray-600 text-lg">
          Your mobile-first workout companion
        </p>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Bandits Training Tracker
          </h2>
          <p className="text-gray-600 mb-4">
            This is a mobile-first workout tracking application built with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>React 18 + TypeScript</li>
            <li>Vite for blazing fast builds</li>
            <li>TailwindCSS for beautiful, responsive design</li>
            <li>React Router for navigation</li>
            <li>React Query for data fetching</li>
            <li>Supabase for backend services</li>
          </ul>
          <div className="flex gap-4 flex-wrap">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-bandits-primary rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong className="text-bandits-primary">Note:</strong> Configure your Supabase
            credentials in a <code className="bg-gray-200 px-2 py-1 rounded">.env</code> file
            based on <code className="bg-gray-200 px-2 py-1 rounded">.env.example</code>
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
