/**
 * TypeScript Type Definitions for Bandits Training Tracker
 *
 * This file contains complete type definitions for the database schema,
 * including Supabase helper types and extended types for UI components.
 *
 * Generated from: supabase/migrations/001_initial_schema.sql
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Exercise difficulty levels
 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Workout session status
 */
export type WorkoutSessionStatus = 'in_progress' | 'completed' | 'skipped';

/**
 * Exercise type categories
 */
export type ExerciseType = 'strength' | 'cardio' | 'mobility' | 'plyometric' | 'other';

// ============================================================================
// JSONB STRUCTURED TYPES
// ============================================================================

/**
 * Prescribed set structure for workout_exercises.prescribed_sets
 * Defines the prescription for a single set in a workout
 */
export interface PrescribedSet {
  /** Set number (1, 2, 3...) */
  set: number;
  /** Percentage of 1RM to use (0-100) */
  weight_pct?: number;
  /** Target number of repetitions */
  reps?: number;
  /** Duration in seconds for timed exercises */
  duration_seconds?: number;
  /** Tempo notation (e.g., "3010" = 3s eccentric, 0s bottom, 1s concentric, 0s top) */
  tempo?: string;
  /** Additional notes for this set */
  notes?: string;
}

// ============================================================================
// BASE TABLE INTERFACES
// ============================================================================

/**
 * Training program containing multiple workouts
 * Example: "Gophers Summer 2024"
 */
export interface Program {
  /** UUID primary key */
  id: string;
  /** Program name */
  name: string;
  /** Sport type (e.g., "Baseball", "Basketball") */
  sport: string | null;
  /** Season identifier (e.g., "Summer 2024") */
  season: string | null;
  /** Program description */
  description: string | null;
  /** Timestamp when program was created */
  created_at: string;
  /** Timestamp when program was last updated */
  updated_at: string;
}

/**
 * Individual workout template within a program
 * Example: "Monday - Week 1"
 */
export interface Workout {
  /** UUID primary key */
  id: string;
  /** Reference to parent program */
  program_id: string;
  /** Workout name */
  name: string;
  /** Day of week (e.g., "Monday") */
  day_of_week: string | null;
  /** Week number in program (1-8) */
  week_number: number | null;
  /** Sort order for displaying workouts */
  workout_order: number | null;
  /** Workout notes (warm-up instructions, etc.) */
  notes: string | null;
  /** Timestamp when workout was created */
  created_at: string;
}

/**
 * Master exercise library with video service integration
 * Contains exercise metadata, video links, and tracking configuration
 */
export interface ExerciseCard {
  /** UUID primary key */
  id: string;
  /** Full exercise name (e.g., "Front Squat") */
  name: string;
  /** Abbreviated name for mobile display */
  short_name: string | null;

  // Video Service Integration
  /** Array of step-by-step instructions */
  instructions: string[] | null;
  /** Array of coaching tips and cues */
  coaching_cues: string[] | null;
  /** Array of timestamp strings for video screenshots (e.g., ["01:30", "02:15"]) */
  screenshot_timestamps: string[] | null;
  /** YouTube or direct video link URL */
  video_url: string | null;
  /** Start time in video (e.g., "01:30") */
  video_start_time: string | null;
  /** End time in video (e.g., "02:15") */
  video_end_time: string | null;

  // Exercise Metadata
  /** Difficulty level */
  difficulty: Difficulty | null;
  /** Array of equipment needed */
  equipment: string[] | null;
  /** Exercise type category */
  exercise_type: ExerciseType | null;
  /** Array of target muscle groups */
  primary_muscle_groups: string[] | null;

  // Tracking Configuration
  /** Whether this exercise tracks weight */
  tracks_weight: boolean;
  /** Whether this exercise tracks reps */
  tracks_reps: boolean;
  /** Whether this exercise tracks duration */
  tracks_duration: boolean;
  /** Whether this exercise tracks distance */
  tracks_distance: boolean;
  /** Default rest time between sets in seconds */
  default_rest_seconds: number;

  /** Timestamp when exercise card was created */
  created_at: string;
  /** Timestamp when exercise card was last updated */
  updated_at: string;
}

/**
 * Junction table linking exercises to workouts with prescription details
 * Defines which exercises appear in a workout and how they should be performed
 */
export interface WorkoutExercise {
  /** UUID primary key */
  id: string;
  /** Reference to parent workout */
  workout_id: string;
  /** Reference to exercise card */
  exercise_card_id: string;
  /** Position in workout (1, 2, 3...) */
  exercise_order: number;
  /** Superset identifier (e.g., "1a", "1b", "2a") for grouping exercises */
  superset_group: string | null;
  /** Array of set prescriptions */
  prescribed_sets: PrescribedSet[];
  /** Exercise-specific notes for this workout */
  notes: string | null;
  /** Timestamp when workout exercise was created */
  created_at: string;
}

/**
 * Logged workout session by an athlete
 * Tracks when a workout was started, completed, and its status
 */
export interface WorkoutSession {
  /** UUID primary key */
  id: string;
  /** Reference to workout template */
  workout_id: string;
  /** Athlete user ID (NULL for POC, will be user_id in multi-user v2) */
  athlete_id: string | null;
  /** Timestamp when workout was started */
  started_at: string;
  /** Timestamp when workout was completed */
  completed_at: string | null;
  /** Session status */
  status: WorkoutSessionStatus;
  /** Session notes */
  notes: string | null;
  /** Timestamp when session was created */
  created_at: string;
}

/**
 * Individual set log for each exercise in a workout session
 * Tracks actual performance data: weight, reps, RPE, etc.
 */
export interface ExerciseLog {
  /** UUID primary key */
  id: string;
  /** Reference to parent workout session */
  workout_session_id: string;
  /** Reference to workout exercise prescription */
  workout_exercise_id: string;
  /** Set number (1, 2, 3...) */
  set_number: number;
  /** Weight used in pounds or kilograms */
  weight: number | null;
  /** Number of repetitions completed */
  reps: number | null;
  /** Duration in seconds (for timed exercises) */
  duration_seconds: number | null;
  /** Distance in meters or miles */
  distance: number | null;
  /** Rate of Perceived Exertion (1-10 scale) */
  rpe: number | null;
  /** Whether the set was completed */
  completed: boolean;
  /** Set-specific notes */
  notes: string | null;
  /** Timestamp when set was logged */
  logged_at: string;
}

// ============================================================================
// SUPABASE DATABASE TYPE
// ============================================================================

/**
 * Complete database schema type for Supabase
 * Includes all tables with their relationships
 */
export interface Database {
  public: {
    Tables: {
      programs: {
        Row: Program;
        Insert: Omit<Program, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Program, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      workouts: {
        Row: Workout;
        Insert: Omit<Workout, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Workout, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'workouts_program_id_fkey';
            columns: ['program_id'];
            referencedRelation: 'programs';
            referencedColumns: ['id'];
          }
        ];
      };
      exercise_cards: {
        Row: ExerciseCard;
        Insert: Omit<ExerciseCard, 'id' | 'created_at' | 'updated_at' | 'tracks_weight' | 'tracks_reps' | 'tracks_duration' | 'tracks_distance' | 'default_rest_seconds'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tracks_weight?: boolean;
          tracks_reps?: boolean;
          tracks_duration?: boolean;
          tracks_distance?: boolean;
          default_rest_seconds?: number;
        };
        Update: Partial<Omit<ExerciseCard, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      workout_exercises: {
        Row: WorkoutExercise;
        Insert: Omit<WorkoutExercise, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<WorkoutExercise, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_exercise_card_id_fkey';
            columns: ['exercise_card_id'];
            referencedRelation: 'exercise_cards';
            referencedColumns: ['id'];
          }
        ];
      };
      workout_sessions: {
        Row: WorkoutSession;
        Insert: Omit<WorkoutSession, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: WorkoutSessionStatus;
        };
        Update: Partial<Omit<WorkoutSession, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'workout_sessions_workout_id_fkey';
            columns: ['workout_id'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          }
        ];
      };
      exercise_logs: {
        Row: ExerciseLog;
        Insert: Omit<ExerciseLog, 'id' | 'logged_at' | 'completed'> & {
          id?: string;
          logged_at?: string;
          completed?: boolean;
        };
        Update: Partial<Omit<ExerciseLog, 'id' | 'logged_at'>>;
        Relationships: [
          {
            foreignKeyName: 'exercise_logs_workout_session_id_fkey';
            columns: ['workout_session_id'];
            referencedRelation: 'workout_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercise_logs_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      difficulty: Difficulty;
      workout_session_status: WorkoutSessionStatus;
      exercise_type: ExerciseType;
    };
  };
}

// ============================================================================
// SUPABASE HELPER TYPES
// ============================================================================

/**
 * Extract Row type for a table
 * @example type ProgramRow = Tables<'programs'>
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Extract Insert type for a table
 * @example type ProgramInsert = TablesInsert<'programs'>
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Extract Update type for a table
 * @example type ProgramUpdate = TablesUpdate<'programs'>
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// ============================================================================
// EXTENDED TYPES FOR UI COMPONENTS
// ============================================================================

/**
 * Workout with joined exercises and exercise cards
 * Used for displaying complete workout details in the UI
 */
export interface WorkoutWithExercises extends Workout {
  /** Array of exercises in this workout with their exercise card details */
  exercises: (WorkoutExercise & {
    exercise_card: ExerciseCard;
  })[];
}

/**
 * Workout with its parent program information
 * Useful for displaying workout context
 */
export interface WorkoutWithProgram extends Workout {
  /** Parent program details */
  program: Program;
}

/**
 * Exercise log with previous set data for comparison
 * Used in workout logging UI to show progression
 */
export interface ExerciseLogWithPrevious extends ExerciseLog {
  /** Previous set data from the last workout session */
  previous_set?: {
    weight: number | null;
    reps: number | null;
    duration_seconds: number | null;
    distance: number | null;
    rpe: number | null;
    logged_at: string;
  } | null;
  /** Prescribed set data from the workout template */
  prescribed_set?: PrescribedSet;
  /** Exercise card details for this log */
  exercise_card?: ExerciseCard;
}

/**
 * Workout session with complete workout details
 * Used for session history and active workout display
 */
export interface WorkoutSessionWithDetails extends WorkoutSession {
  /** Workout template details */
  workout: WorkoutWithExercises;
  /** All exercise logs for this session grouped by exercise */
  exercise_logs?: ExerciseLog[];
}

/**
 * Program with all its workouts
 * Used for program overview and navigation
 */
export interface ProgramWithWorkouts extends Program {
  /** Array of all workouts in this program, ordered by workout_order */
  workouts: Workout[];
}

/**
 * Workout exercise with current session logs
 * Used during active workout to track progress
 */
export interface WorkoutExerciseWithLogs extends WorkoutExercise {
  /** Exercise card details */
  exercise_card: ExerciseCard;
  /** Exercise logs for the current session */
  session_logs: ExerciseLog[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for creating a new program
 */
export type CreateProgramInput = TablesInsert<'programs'>;

/**
 * Type for updating an existing program
 */
export type UpdateProgramInput = TablesUpdate<'programs'>;

/**
 * Type for creating a new workout
 */
export type CreateWorkoutInput = TablesInsert<'workouts'>;

/**
 * Type for updating an existing workout
 */
export type UpdateWorkoutInput = TablesUpdate<'workouts'>;

/**
 * Type for creating a new exercise card
 */
export type CreateExerciseCardInput = TablesInsert<'exercise_cards'>;

/**
 * Type for updating an existing exercise card
 */
export type UpdateExerciseCardInput = TablesUpdate<'exercise_cards'>;

/**
 * Type for creating a new workout exercise
 */
export type CreateWorkoutExerciseInput = TablesInsert<'workout_exercises'>;

/**
 * Type for updating an existing workout exercise
 */
export type UpdateWorkoutExerciseInput = TablesUpdate<'workout_exercises'>;

/**
 * Type for creating a new workout session
 */
export type CreateWorkoutSessionInput = TablesInsert<'workout_sessions'>;

/**
 * Type for updating an existing workout session
 */
export type UpdateWorkoutSessionInput = TablesUpdate<'workout_sessions'>;

/**
 * Type for creating a new exercise log
 */
export type CreateExerciseLogInput = TablesInsert<'exercise_logs'>;

/**
 * Type for updating an existing exercise log
 */
export type UpdateExerciseLogInput = TablesUpdate<'exercise_logs'>;

/**
 * Type for exercise log form data (used in UI forms)
 */
export interface ExerciseLogFormData {
  set_number: number;
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance?: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
}

/**
 * Type for workout session summary statistics
 */
export interface WorkoutSessionSummary {
  session_id: string;
  workout_name: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  total_exercises: number;
  completed_exercises: number;
  total_sets: number;
  completed_sets: number;
  total_volume: number; // sum of weight × reps
  average_rpe: number | null;
}

/**
 * Type for exercise performance history
 */
export interface ExercisePerformanceHistory {
  exercise_card_id: string;
  exercise_name: string;
  sessions: {
    session_id: string;
    workout_name: string;
    logged_at: string;
    sets: {
      set_number: number;
      weight: number | null;
      reps: number | null;
      rpe: number | null;
    }[];
    max_weight: number | null;
    total_volume: number;
  }[];
}
