# API Documentation

## Overview

This document outlines the API functions used to interact with the Supabase backend.

All API functions are located in `src/lib/queries.ts` and use the Supabase client from `src/lib/supabase.ts`.

## Authentication

### `signUp(email, password)`
Create a new user account.

**Returns**: User object or error

### `signIn(email, password)`
Sign in an existing user.

**Returns**: Session object or error

### `signOut()`
Sign out the current user.

**Returns**: void or error

### `getCurrentUser()`
Get the currently authenticated user.

**Returns**: User object or null

## Profiles

### `getProfile(userId: string)`
Get a user profile by ID.

**Returns**: Profile object or null

### `updateProfile(userId: string, data: ProfileUpdate)`
Update a user profile.

**Returns**: Updated profile or error

## Exercises

### `getExercises()`
Get all available exercises.

**Returns**: Array of Exercise objects

### `getExerciseById(id: string)`
Get a specific exercise by ID.

**Returns**: Exercise object or null

### `searchExercises(query: string)`
Search exercises by name or category.

**Returns**: Array of Exercise objects

## Workouts

### `createWorkout(data: WorkoutCreate)`
Start a new workout session.

**Returns**: Workout object

### `getWorkoutById(id: string)`
Get a specific workout with all exercises and sets.

**Returns**: Complete workout object or null

### `getWorkoutHistory(userId: string, limit?: number)`
Get workout history for a user.

**Returns**: Array of Workout objects (most recent first)

### `updateWorkout(id: string, data: WorkoutUpdate)`
Update workout details (e.g., notes, completion).

**Returns**: Updated workout object

### `deleteWorkout(id: string)`
Delete a workout session.

**Returns**: void or error

## Workout Exercises

### `addExerciseToWorkout(workoutId: string, exerciseId: string)`
Add an exercise to a workout.

**Returns**: WorkoutExercise object

### `removeExerciseFromWorkout(workoutExerciseId: string)`
Remove an exercise from a workout.

**Returns**: void or error

## Sets

### `addSet(workoutExerciseId: string, data: SetCreate)`
Add a new set to a workout exercise.

**Returns**: Set object

### `updateSet(id: string, data: SetUpdate)`
Update set details (weight, reps, RPE).

**Returns**: Updated set object

### `deleteSet(id: string)`
Delete a set.

**Returns**: void or error

## React Query Usage

All API functions should be wrapped in React Query hooks for optimal caching and state management.

**Example:**

```typescript
// In src/hooks/useWorkouts.ts
import { useQuery } from '@tanstack/react-query'
import { getWorkoutHistory } from '@/lib/queries'

export function useWorkoutHistory(userId: string) {
  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => getWorkoutHistory(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

## Error Handling

All API functions return either:
- `{ data: T, error: null }` on success
- `{ data: null, error: PostgrestError }` on failure

Always check for errors before using the data:

```typescript
const { data, error } = await getProfile(userId)
if (error) {
  console.error('Failed to fetch profile:', error)
  return
}
// Use data safely
```

## Real-time Subscriptions (Future)

Supabase Realtime can be used for live updates:

```typescript
// Subscribe to workout updates
const subscription = supabase
  .channel('workouts')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'workouts',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Workout updated:', payload)
  })
  .subscribe()
```
