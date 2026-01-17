# TypeScript Type Definitions - Usage Guide

Quick reference guide for using type definitions in the Bandits Training Tracker application.

## 📍 Import Types

```typescript
// Base table types
import type {
  Program,
  Workout,
  ExerciseCard,
  WorkoutExercise,
  WorkoutSession,
  ExerciseLog,
} from '@/lib/types';

// Enums
import type {
  Difficulty,
  WorkoutSessionStatus,
  ExerciseType,
} from '@/lib/types';

// Supabase helper types
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/lib/types';

// Extended types for UI
import type {
  WorkoutWithExercises,
  WorkoutSessionWithDetails,
  ProgramWithWorkouts,
} from '@/lib/types';

// Utility types
import type {
  CreateProgramInput,
  UpdateProgramInput,
  ExerciseLogFormData,
} from '@/lib/types';
```

## 🔧 Creating a Typed Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client with type parameter
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

## 📖 Common Usage Patterns

### 1. SELECT Queries

```typescript
// Get all programs
const { data: programs, error } = await supabase
  .from('programs')
  .select('*');

// Type is inferred as Program[] | null
if (programs) {
  programs.forEach((program) => {
    console.log(program.name); // ✅ TypeScript knows this exists
  });
}

// Get single program
const { data: program, error } = await supabase
  .from('programs')
  .select('*')
  .eq('id', programId)
  .single();

// Type is inferred as Program | null
```

### 2. INSERT Operations

```typescript
// Use CreateProgramInput for type safety
const newProgram: CreateProgramInput = {
  name: 'Gophers Summer 2024',
  sport: 'Baseball',
  season: 'Summer 2024',
  description: 'Summer training program',
};

const { data, error } = await supabase
  .from('programs')
  .insert(newProgram)
  .select()
  .single();

// TypeScript will error if required fields are missing!
```

### 3. UPDATE Operations

```typescript
// Use UpdateProgramInput for partial updates
const updates: UpdateProgramInput = {
  name: 'Updated Program Name',
  // Other fields are optional
};

const { data, error } = await supabase
  .from('programs')
  .update(updates)
  .eq('id', programId)
  .select()
  .single();
```

### 4. Joined Queries

```typescript
// Get workout with exercises
const { data: workout, error } = await supabase
  .from('workouts')
  .select(`
    *,
    exercises:workout_exercises(
      *,
      exercise_card:exercise_cards(*)
    )
  `)
  .eq('id', workoutId)
  .single();

// Cast to extended type for better type inference
const typedWorkout = workout as WorkoutWithExercises;

if (typedWorkout) {
  typedWorkout.exercises.forEach((exercise) => {
    console.log(exercise.exercise_card.name); // ✅ Fully typed!
  });
}
```

### 5. Working with JSONB Fields

```typescript
// WorkoutExercise with prescribed_sets
const workoutExercise: WorkoutExercise = {
  id: 'uuid',
  workout_id: 'workout-uuid',
  exercise_card_id: 'exercise-uuid',
  exercise_order: 1,
  superset_group: '1a',
  prescribed_sets: [
    { set: 1, weight_pct: 55, reps: 5 },
    { set: 2, weight_pct: 65, reps: 5 },
    { set: 3, weight_pct: 75, reps: 5 },
  ],
  notes: null,
  created_at: new Date().toISOString(),
};

// TypeScript knows prescribed_sets is PrescribedSet[]
workoutExercise.prescribed_sets.forEach((set) => {
  console.log(`Set ${set.set}: ${set.reps} reps at ${set.weight_pct}%`);
});
```

### 6. Using Helper Types

```typescript
// Extract types for a specific table
type ProgramRow = Tables<'programs'>; // Same as Program
type ProgramInsert = TablesInsert<'programs'>; // Same as CreateProgramInput
type ProgramUpdate = TablesUpdate<'programs'>; // Same as UpdateProgramInput

// Use in function signatures
async function createProgram(input: TablesInsert<'programs'>): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create program');
  return data;
}
```

## 🎨 React Component Examples

### Example 1: Display Program List

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Program } from '@/lib/types';

export function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setPrograms(data);
      setLoading(false);
    }

    fetchPrograms();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {programs.map((program) => (
        <div key={program.id}>
          <h2>{program.name}</h2>
          <p>{program.sport} - {program.season}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Create Program Form

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CreateProgramInput } from '@/lib/types';

export function CreateProgramForm() {
  const [formData, setFormData] = useState<CreateProgramInput>({
    name: '',
    sport: null,
    season: null,
    description: null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase
      .from('programs')
      .insert(formData)
      .select()
      .single();

    if (error) {
      console.error('Error creating program:', error);
    } else {
      console.log('Created program:', data);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Program Name"
        required
      />
      {/* Add more fields... */}
      <button type="submit">Create Program</button>
    </form>
  );
}
```

### Example 3: Workout with Exercises

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutWithExercises } from '@/lib/types';

interface WorkoutDetailProps {
  workoutId: string;
}

export function WorkoutDetail({ workoutId }: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);

  useEffect(() => {
    async function fetchWorkout() {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            *,
            exercise_card:exercise_cards(*)
          )
        `)
        .eq('id', workoutId)
        .single();

      if (data) {
        setWorkout(data as WorkoutWithExercises);
      }
    }

    fetchWorkout();
  }, [workoutId]);

  if (!workout) return <div>Loading...</div>;

  return (
    <div>
      <h1>{workout.name}</h1>
      <p>Week {workout.week_number} - {workout.day_of_week}</p>

      <div>
        {workout.exercises.map((exercise) => (
          <div key={exercise.id}>
            <h3>{exercise.exercise_card.name}</h3>
            <p>Sets: {exercise.prescribed_sets.length}</p>
            {exercise.prescribed_sets.map((set) => (
              <div key={set.set}>
                Set {set.set}: {set.reps} reps @ {set.weight_pct}%
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Exercise Log Form

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CreateExerciseLogInput } from '@/lib/types';

interface ExerciseLogFormProps {
  sessionId: string;
  workoutExerciseId: string;
  setNumber: number;
}

export function ExerciseLogForm({
  sessionId,
  workoutExerciseId,
  setNumber,
}: ExerciseLogFormProps) {
  const [logData, setLogData] = useState<CreateExerciseLogInput>({
    workout_session_id: sessionId,
    workout_exercise_id: workoutExerciseId,
    set_number: setNumber,
    weight: null,
    reps: null,
    rpe: null,
    notes: null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase
      .from('exercise_logs')
      .insert(logData)
      .select()
      .single();

    if (error) {
      console.error('Error logging set:', error);
    } else {
      console.log('Logged set:', data);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        step="0.01"
        value={logData.weight ?? ''}
        onChange={(e) => setLogData({ ...logData, weight: parseFloat(e.target.value) })}
        placeholder="Weight"
      />
      <input
        type="number"
        value={logData.reps ?? ''}
        onChange={(e) => setLogData({ ...logData, reps: parseInt(e.target.value) })}
        placeholder="Reps"
      />
      <input
        type="number"
        min="1"
        max="10"
        value={logData.rpe ?? ''}
        onChange={(e) => setLogData({ ...logData, rpe: parseInt(e.target.value) })}
        placeholder="RPE (1-10)"
      />
      <button type="submit">Log Set</button>
    </form>
  );
}
```

## 🔍 Type Guards

Use type guards for runtime type checking:

```typescript
// Check if difficulty is valid
function isValidDifficulty(value: string): value is Difficulty {
  return ['beginner', 'intermediate', 'advanced'].includes(value);
}

// Use in component
const difficulty = 'intermediate';
if (isValidDifficulty(difficulty)) {
  // TypeScript knows difficulty is Difficulty type here
}
```

## 🛠️ Repository Pattern (Recommended)

Create type-safe repository classes:

```typescript
// repositories/programs.ts
import { supabase } from '@/lib/supabase';
import type { Program, CreateProgramInput, UpdateProgramInput } from '@/lib/types';

export class ProgramRepository {
  async getAll(): Promise<Program[]> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Program | null> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(input: CreateProgramInput): Promise<Program> {
    const { data, error } = await supabase
      .from('programs')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create program');
    return data;
  }

  async update(id: string, input: UpdateProgramInput): Promise<Program> {
    const { data, error } = await supabase
      .from('programs')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update program');
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// Use in components
const programRepo = new ProgramRepository();
const programs = await programRepo.getAll();
```

## 📚 Best Practices

1. **Always import types with `type` keyword**
   ```typescript
   import type { Program } from '@/lib/types'; // ✅
   import { Program } from '@/lib/types';      // ❌
   ```

2. **Use helper types for CRUD operations**
   ```typescript
   // ✅ Good
   function createProgram(input: CreateProgramInput) { }

   // ❌ Avoid
   function createProgram(input: Omit<Program, 'id' | 'created_at'>) { }
   ```

3. **Cast joined queries to extended types**
   ```typescript
   const workout = data as WorkoutWithExercises; // ✅
   ```

4. **Use optional chaining for nullable fields**
   ```typescript
   console.log(program.description?.toUpperCase()); // ✅
   ```

5. **Validate enum values at runtime**
   ```typescript
   if (!isValidDifficulty(value)) {
     throw new Error('Invalid difficulty');
   }
   ```

## 🎯 Quick Reference

| Task | Type to Use |
|------|-------------|
| Display data | Base types (`Program`, `Workout`, etc.) |
| Create form | `Create*Input` types |
| Update form | `Update*Input` types |
| Joined queries | Extended types (`WorkoutWithExercises`, etc.) |
| Generic CRUD | Helper types (`Tables<T>`, etc.) |
| Form data | Utility types (`ExerciseLogFormData`, etc.) |

## 📖 See Also

- [QA Guide](./TYPE_DEFINITIONS_QA.md) - Testing and validation
- [Supabase Docs](https://supabase.com/docs/reference/javascript/typescript-support) - Official TypeScript support
- [Database Schema](../supabase/migrations/001_initial_schema.sql) - SQL schema definition
