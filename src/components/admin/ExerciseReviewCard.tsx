/**
 * Exercise Review Card Component
 *
 * Individual exercise card for reviewing AI-extracted exercises
 * before importing to the library.
 *
 * Features:
 * - Checkbox to select/deselect for import
 * - Display exercise name, difficulty, equipment
 * - Show instructions and coaching cues
 * - Video timestamp display
 * - Clean, scannable card design
 */

import { Badge } from '@/components/common'

interface ExerciseReviewCardProps {
  exercise: {
    name: string
    start_time: string
    end_time: string
    instructions: string[]
    coaching_cues: string[]
    screenshot_timestamps: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    equipment: string[]
  }
  index: number
  isSelected: boolean
  onToggle: (index: number) => void
}

export function ExerciseReviewCard({
  exercise,
  index,
  isSelected,
  onToggle,
}: ExerciseReviewCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }

  return (
    <div
      className={`
        relative rounded-lg border-2 p-4 transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 right-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(index)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Exercise Header */}
      <div className="mb-3 pr-12">
        <h3 className="text-lg font-semibold text-gray-900">
          {exercise.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className={difficultyColors[exercise.difficulty]}>
            {exercise.difficulty}
          </Badge>
          <Badge className="bg-gray-100 text-gray-700">
            {exercise.start_time} - {exercise.end_time}
          </Badge>
        </div>
      </div>

      {/* Equipment */}
      {exercise.equipment && exercise.equipment.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">Equipment:</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {exercise.equipment.map((item, i) => (
              <Badge key={i} className="bg-purple-100 text-purple-800">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">Instructions:</p>
          <ol className="mt-1 list-decimal list-inside space-y-1">
            {exercise.instructions.map((instruction, i) => (
              <li key={i} className="text-sm text-gray-600">
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Coaching Cues */}
      {exercise.coaching_cues && exercise.coaching_cues.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">Coaching Cues:</p>
          <ul className="mt-1 space-y-1">
            {exercise.coaching_cues.map((cue, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Screenshot Timestamps */}
      {exercise.screenshot_timestamps && exercise.screenshot_timestamps.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700">Key Moments:</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {exercise.screenshot_timestamps.map((timestamp, i) => (
              <Badge key={i} className="bg-indigo-100 text-indigo-800">
                {timestamp}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
