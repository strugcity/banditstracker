/**
 * Type definitions for the video analysis staging modal system
 */

/**
 * Difficulty levels for exercises
 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * Status of a video analysis session
 */
export type StagingSessionStatus =
  | 'pending'      // Awaiting user review
  | 'in_progress'  // User is actively editing/saving
  | 'completed'    // User finished (saved all or discarded)
  | 'expired'      // 24 hours passed, auto-imported
  | 'error'        // Analysis failed

/**
 * Exercise as extracted by Gemini AI
 */
export interface GeminiExercise {
  name: string
  start_time: string
  end_time: string
  instructions: string[]
  coaching_cues: string[]
  screenshot_timestamps: string[]
  difficulty: Difficulty
  equipment: string[]
}

/**
 * User edits to an exercise before saving
 */
export interface ExerciseEdit {
  name?: string
  instructions?: string[]
  coaching_cues?: string[]
  equipment?: string[]
  difficulty?: Difficulty
  start_time?: string
  end_time?: string
  screenshot_timestamps?: string[]
}

/**
 * Exercise in the staging modal with tracking state
 */
export interface StagedExercise {
  /** Index in the original analysis_result.exercises array */
  originalIndex: number
  /** Exercise name (editable) */
  name: string
  /** Step-by-step instructions (editable) */
  instructions: string[]
  /** Coaching tips (editable) */
  coaching_cues: string[]
  /** Required equipment (editable) */
  equipment: string[]
  /** Difficulty level (editable) */
  difficulty: Difficulty
  /** Start time in video (MM:SS) */
  start_time: string
  /** End time in video (MM:SS) */
  end_time: string
  /** Key moments for screenshots */
  screenshot_timestamps: string[]
  /** True if user has modified this exercise */
  isEdited: boolean
  /** True if already saved to exercise library */
  isSaved: boolean
  /** Exercise ID if already saved */
  savedExerciseId?: string
}

/**
 * Video analysis session from the database (extended for staging modal)
 */
export interface VideoAnalysisSession {
  id: string
  video_url: string
  video_title: string | null
  sport: string | null
  total_duration: string | null
  analysis_result: {
    video_title: string
    sport?: string
    total_duration: string
    exercises: GeminiExercise[]
  }
  status: StagingSessionStatus
  owner_id: string | null
  edited_exercises: Record<string, ExerciseEdit>
  expires_at: string | null
  completed_at: string | null
  auto_imported: boolean
  imported_exercise_ids: string[] | null
  created_at: string
  updated_at: string
}

/**
 * Props for the VideoStagingModal component
 */
export interface VideoStagingModalProps {
  /** Session ID to load */
  sessionId: string
  /** Whether the modal is open */
  isOpen: boolean
  /** Called when modal is closed (X button or backdrop click) */
  onClose: () => void
  /** Called after successful save/complete */
  onComplete: () => void
}

/**
 * State managed by the VideoStagingModal
 */
export interface StagingModalState {
  /** Loaded session data */
  session: VideoAnalysisSession | null
  /** Exercises with edit state */
  exercises: StagedExercise[]
  /** Indices of selected exercises for batch operations */
  selectedIndices: Set<number>
  /** Index of currently expanded exercise (for editing) */
  expandedIndex: number | null
  /** Loading state */
  isLoading: boolean
  /** Saving state (individual or batch) */
  isSaving: boolean
  /** Error message if any */
  error: string | null
}

/**
 * Props for the ExerciseEditorCard component
 */
export interface ExerciseEditorCardProps {
  /** Exercise data */
  exercise: StagedExercise
  /** Index in the exercises array */
  index: number
  /** Whether this exercise is selected for batch operations */
  isSelected: boolean
  /** Whether this exercise is expanded for editing */
  isExpanded: boolean
  /** Toggle selection */
  onToggleSelect: () => void
  /** Toggle expanded state */
  onToggleExpand: () => void
  /** Handle changes to exercise fields */
  onChange: (updates: Partial<StagedExercise>) => void
  /** Save this individual exercise to library */
  onSaveIndividual: () => Promise<void>
  /** Whether save is in progress */
  isSaving: boolean
}

/**
 * Return type for the useStagingSessions hook
 */
export interface UseStagingSessionsReturn {
  /** Number of open (pending/in_progress) sessions */
  openSessionCount: number
  /** True if user can create a new session (count < 3) */
  canCreateNewSession: boolean
  /** List of open sessions */
  sessions: VideoAnalysisSession[]
  /** Loading state */
  isLoading: boolean
  /** Refresh the sessions list */
  refetch: () => void
}

/**
 * Request body for import-to-library edge function
 */
export interface ImportToLibraryRequest {
  sessionId: string
  exerciseIndices: number[]
  editedExercises?: Record<number, ExerciseEdit>
  markComplete?: boolean
}

/**
 * Response from import-to-library edge function
 */
export interface ImportToLibraryResponse {
  success: boolean
  inserted: number
  updated: number
  sessionStatus: StagingSessionStatus
  totalImported: number
  totalExercises: number
  exercises: Array<{
    id: string
    name: string
    difficulty: Difficulty
    equipment: string[]
    is_new: boolean
  }>
}

/**
 * Request body for analyze-video edge function
 */
export interface AnalyzeVideoRequest {
  videoUrl: string
  sport?: string
}

/**
 * Response from analyze-video edge function
 */
export interface AnalyzeVideoResponse {
  success: boolean
  sessionId: string
  expiresAt: string
  analysis: {
    video_title: string
    sport?: string
    total_duration: string
    exercise_count: number
  }
  exercises: Array<{
    name: string
    difficulty: Difficulty
    equipment: string[]
    start_time: string
    end_time: string
  }>
}

/**
 * Error response from edge functions
 */
export interface EdgeFunctionError {
  error: string
  message?: string
  hint?: string
  details?: string
  currentCount?: number
  maxAllowed?: number
}

/**
 * Convert GeminiExercise to StagedExercise
 */
export function toStagedExercise(
  exercise: GeminiExercise,
  index: number,
  edits?: ExerciseEdit,
  savedId?: string
): StagedExercise {
  return {
    originalIndex: index,
    name: edits?.name ?? exercise.name,
    instructions: edits?.instructions ?? exercise.instructions,
    coaching_cues: edits?.coaching_cues ?? exercise.coaching_cues,
    equipment: edits?.equipment ?? exercise.equipment,
    difficulty: edits?.difficulty ?? exercise.difficulty,
    start_time: edits?.start_time ?? exercise.start_time,
    end_time: edits?.end_time ?? exercise.end_time,
    screenshot_timestamps: edits?.screenshot_timestamps ?? exercise.screenshot_timestamps,
    isEdited: !!edits && Object.keys(edits).length > 0,
    isSaved: !!savedId,
    savedExerciseId: savedId,
  }
}

/**
 * Extract edits from a StagedExercise compared to original
 */
export function extractEdits(
  staged: StagedExercise,
  original: GeminiExercise
): ExerciseEdit | null {
  const edits: ExerciseEdit = {}

  if (staged.name !== original.name) edits.name = staged.name
  if (JSON.stringify(staged.instructions) !== JSON.stringify(original.instructions)) {
    edits.instructions = staged.instructions
  }
  if (JSON.stringify(staged.coaching_cues) !== JSON.stringify(original.coaching_cues)) {
    edits.coaching_cues = staged.coaching_cues
  }
  if (JSON.stringify(staged.equipment) !== JSON.stringify(original.equipment)) {
    edits.equipment = staged.equipment
  }
  if (staged.difficulty !== original.difficulty) edits.difficulty = staged.difficulty
  if (staged.start_time !== original.start_time) edits.start_time = staged.start_time
  if (staged.end_time !== original.end_time) edits.end_time = staged.end_time
  if (JSON.stringify(staged.screenshot_timestamps) !== JSON.stringify(original.screenshot_timestamps)) {
    edits.screenshot_timestamps = staged.screenshot_timestamps
  }

  return Object.keys(edits).length > 0 ? edits : null
}

/**
 * Calculate time remaining until session expires
 */
export function getTimeRemaining(expiresAt: string | null): {
  hours: number
  minutes: number
  isExpired: boolean
  isWarning: boolean
} {
  if (!expiresAt) {
    return { hours: 0, minutes: 0, isExpired: true, isWarning: true }
  }

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isExpired: true, isWarning: true }
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return {
    hours,
    minutes,
    isExpired: false,
    isWarning: hours < 1, // Warning when less than 1 hour remaining
  }
}
