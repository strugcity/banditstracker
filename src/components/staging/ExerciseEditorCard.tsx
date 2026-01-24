/**
 * Exercise Editor Card Component
 *
 * Collapsible card for editing an exercise before saving to library.
 * Features:
 * - Selection checkbox
 * - Expandable editing interface
 * - Editable fields: name, instructions, cues, equipment, difficulty
 * - Individual save button
 * - Visual indicators for saved/edited status
 */

import { useState } from 'react'
import { Button, Badge } from '@/components/common'
import type { ExerciseEditorCardProps, StagedExercise, Difficulty } from '@/types/staging'

export function ExerciseEditorCard({
  exercise,
  index,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onChange,
  onSaveIndividual,
  isSaving,
}: ExerciseEditorCardProps) {
  // Local state for array editing
  const [newInstruction, setNewInstruction] = useState('')
  const [newCue, setNewCue] = useState('')
  const [newEquipment, setNewEquipment] = useState('')

  const difficultyColors: Record<Difficulty, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }

  // Add instruction
  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return
    onChange({
      instructions: [...exercise.instructions, newInstruction.trim()],
    })
    setNewInstruction('')
  }

  // Remove instruction
  const handleRemoveInstruction = (idx: number) => {
    onChange({
      instructions: exercise.instructions.filter((_, i) => i !== idx),
    })
  }

  // Add coaching cue
  const handleAddCue = () => {
    if (!newCue.trim()) return
    onChange({
      coaching_cues: [...exercise.coaching_cues, newCue.trim()],
    })
    setNewCue('')
  }

  // Remove coaching cue
  const handleRemoveCue = (idx: number) => {
    onChange({
      coaching_cues: exercise.coaching_cues.filter((_, i) => i !== idx),
    })
  }

  // Add equipment
  const handleAddEquipment = () => {
    if (!newEquipment.trim()) return
    if (exercise.equipment.includes(newEquipment.trim())) return
    onChange({
      equipment: [...exercise.equipment, newEquipment.trim()],
    })
    setNewEquipment('')
  }

  // Remove equipment
  const handleRemoveEquipment = (item: string) => {
    onChange({
      equipment: exercise.equipment.filter((e) => e !== item),
    })
  }

  return (
    <div
      className={`
        border rounded-lg transition-all
        ${exercise.isSaved
          ? 'bg-green-50 border-green-200'
          : isSelected
            ? 'bg-blue-50 border-blue-300'
            : 'bg-white border-gray-200'
        }
      `}
    >
      {/* Header */}
      <div
        className="flex items-center p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Checkbox */}
        <div className="mr-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            disabled={exercise.isSaved}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Exercise info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {exercise.name}
            </h3>
            {exercise.isSaved && (
              <Badge variant="success" size="sm">
                Saved
              </Badge>
            )}
            {exercise.isEdited && !exercise.isSaved && (
              <Badge variant="warning" size="sm">
                Edited
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[exercise.difficulty]}`}
            >
              {exercise.difficulty}
            </span>
            <span>
              {exercise.start_time} - {exercise.end_time}
            </span>
            {exercise.equipment.length > 0 && (
              <span className="text-gray-400">
                {exercise.equipment.length} equipment
              </span>
            )}
          </div>
        </div>

        {/* Expand/collapse arrow */}
        <div className="ml-3">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onChange({ name: e.target.value })}
              disabled={exercise.isSaved}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={exercise.difficulty}
              onChange={(e) =>
                onChange({ difficulty: e.target.value as Difficulty })
              }
              disabled={exercise.isSaved}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Video timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={exercise.start_time}
                onChange={(e) => onChange({ start_time: e.target.value })}
                disabled={exercise.isSaved}
                placeholder="MM:SS"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="text"
                value={exercise.end_time}
                onChange={(e) => onChange({ end_time: e.target.value })}
                disabled={exercise.isSaved}
                placeholder="MM:SS"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <div className="space-y-2">
              {exercise.instructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-gray-700">{instruction}</span>
                  {!exercise.isSaved && (
                    <button
                      onClick={() => handleRemoveInstruction(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {!exercise.isSaved && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInstruction}
                    onChange={(e) => setNewInstruction(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddInstruction()}
                    placeholder="Add instruction..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddInstruction}
                    disabled={!newInstruction.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Coaching Cues */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coaching Cues
            </label>
            <div className="space-y-2">
              {exercise.coaching_cues.map((cue, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="flex-1 text-gray-700">{cue}</span>
                  {!exercise.isSaved && (
                    <button
                      onClick={() => handleRemoveCue(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {!exercise.isSaved && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCue}
                    onChange={(e) => setNewCue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCue()}
                    placeholder="Add coaching cue..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCue}
                    disabled={!newCue.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {exercise.equipment.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {item}
                  {!exercise.isSaved && (
                    <button
                      onClick={() => handleRemoveEquipment(item)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!exercise.isSaved && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEquipment()}
                  placeholder="Add equipment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddEquipment}
                  disabled={!newEquipment.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Individual save button */}
          {!exercise.isSaved && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={onSaveIndividual}
                disabled={isSaving}
                fullWidth
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  'Save This Exercise'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
