# Debug Session Summary - Workout Exercises Not Loading

## Current Status: IN PROGRESS

**Date:** January 17, 2026
**Issue:** Week 1 workouts show "No Exercises Found" despite exercises existing in database

---

## Problem Description

When clicking on any Week 1 workout (Monday through Friday), the page displays an empty state with "No Exercises Found" message. The `workout.exercises` property is `undefined` instead of containing the expected exercise array.

---

## Key Findings

### ✅ Data EXISTS in Database
Confirmed via SQL query that workout_exercises are properly inserted:
- Monday Week 1: 8 exercises
- Tuesday Week 1: 5 exercises
- Wednesday Week 1: 6 exercises
- Thursday Week 1: 6 exercises
- Friday Week 1: 6 exercises

SQL query result for Wednesday (workout_id: `3b0c33f3-b14d-4b1c-92e6-2adb01d6300f`):
```json
[
  {
    "id": "02194049-7815-42d2-8100-cb6286ba0a07",
    "workout_id": "3b0c33f3-b14d-4b1c-92e6-2adb01d6300f",
    "exercise_card_id": "33bca2e3-6657-4db1-bf01-5f67114ebb88",
    "exercise_order": 1,
    "superset_group": "1a",
    "prescribed_sets": [...],
    "exercise_name": "Back Squat"
  },
  // ... 5 more exercises
]
```

### ✅ RLS (Row Level Security) is DISABLED
Ran `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` on all tables. This was confirmed successful.

### ❌ JavaScript Query Returns `undefined`
Console output shows:
```javascript
exercises: undefined
exercisesCount: 0
```

### ⚠️ Debug Logs Not Appearing
The `console.error` statements inside `getWorkoutWithExercises` function (queries.ts:132-143) are **NOT showing up** in the browser console. This suggests either:
1. The function isn't being called
2. There's a compilation/caching issue
3. The code isn't hot-reloading properly

---

## Code Changes Made

### 1. Fixed Crash in WorkoutPage.tsx
**Location:** `src/pages/WorkoutPage.tsx:84-95`

Added optional chaining to prevent crash when `exercises` is undefined:
```typescript
// Before:
const groupedExercises = workout?.exercises.reduce(...)
const totalSets = workout?.exercises.reduce(...)

// After:
const groupedExercises = workout?.exercises?.reduce(...)
const totalSets = workout?.exercises?.reduce(...)
```

### 2. Enhanced Debug Logging in queries.ts
**Location:** `src/lib/queries.ts:131-143`

Added comprehensive debug logging:
```typescript
console.error('🔍🔍🔍 DEBUG - getWorkoutWithExercises query results:', {
  workoutId,
  workoutName: workout.name,
  exercisesRaw: exercises,
  exercisesReturned: exercises?.length || 0,
  exercisesIsNull: exercises === null,
  exercisesIsUndefined: exercises === undefined,
  exercisesError: exercisesError,
  hasError: !!exercisesError
})

console.table(exercises)
```

**ISSUE:** These logs are not appearing in console, which is suspicious.

### 3. Added Null/Undefined Handling
**Location:** `src/lib/queries.ts:145-153`

```typescript
// Handle null/undefined exercises (return empty array instead)
const exercisesArray = exercises || []

return {
  ...(workout as Workout),
  exercises: exercisesArray as (WorkoutExercise & { exercise_card: ExerciseCard })[],
} as WorkoutWithExercises
```

---

## Supabase Query Structure

**Current Query:**
```typescript
const { data: exercises, error: exercisesError } = await supabase
  .from('workout_exercises')
  .select(`
    *,
    exercise_card:exercise_cards(*)
  `)
  .eq('workout_id', workoutId)
  .order('exercise_order', { ascending: true })
```

**Expected Behavior:** Should return array of workout_exercises with nested exercise_card objects

**Actual Behavior:** Returns `undefined` (based on console logs)

---

## Network Evidence

User showed fetch request to Supabase for `workout_sessions`:
```
GET https://xaknhwxfkcxtqjkwkccn.supabase.co/rest/v1/workout_sessions?...
```

**Need to check:** Network request for `workout_exercises` table to see what Supabase is actually returning.

---

## Files Created for Debugging

1. **debug-query.sql** - Comprehensive SQL diagnostic queries
2. **verify-data.sql** - Quick verification queries (USED - confirmed data exists)
3. **disable-rls-for-testing.sql** - RLS disable script (EXECUTED - confirmed successful)
4. **DEBUG-SESSION-SUMMARY.md** - This file

---

## Next Steps for Tomorrow

### Priority 1: Verify Query Execution
1. **Check Network Tab** for `workout_exercises` request
   - Open DevTools → Network tab
   - Filter by "workout_exercises" or Supabase domain
   - Click on a workout
   - Check Response/Preview tab to see what data is returned

2. **Verify Hot Reload is Working**
   - The debug logs aren't showing up, which suggests code might not be updating
   - Try hard refresh (Ctrl+Shift+R) or restart dev server
   - Add an `alert()` to confirm code is executing

### Priority 2: Test Supabase Query Directly
Try running the query directly in browser console:
```javascript
const { data, error } = await window.supabase
  .from('workout_exercises')
  .select('*, exercise_card:exercise_cards(*)')
  .eq('workout_id', '3b0c33f3-b14d-4b1c-92e6-2adb01d6300f')

console.log('Direct query result:', { data, error })
```

### Priority 3: Check Supabase Types
The query might be failing due to TypeScript type mismatches. Check:
- `src/lib/types.ts` - Database type definitions
- Does the nested select syntax match Supabase v2 API?

### Priority 4: Alternative Query Approach
If nested select fails, try two separate queries:
1. Get workout_exercises
2. Get exercise_cards separately
3. Join them in JavaScript

---

## Hypothesis

**Most Likely:** The Supabase query syntax for nested selects might be incorrect for the version we're using, OR there's a type/schema mismatch preventing the query from executing properly.

**Evidence:**
- SQL query works perfectly (data exists and is properly linked)
- JavaScript query returns undefined
- Debug logs from query function don't appear (suggesting function might not be completing)

**Test:** Check if `exercisesError` has a value that would tell us what's failing.

---

## Console Output Reference

Last console output showed:
```
DEBUG - Workout data: {
  name: 'Wednesday - Week 1 (9-Jul)',
  id: '3b0c33f3-b14d-4b1c-92e6-2adb01d6300f',
  exercisesCount: 0,
  exercises: undefined,
  fullWorkout: {...}
}
```

**Missing:** The `console.error` from inside `getWorkoutWithExercises` never appeared.

---

## Environment Info

- **Dev Server:** Running on http://localhost:3005
- **Supabase URL:** xaknhwxfkcxtqjkwkccn.supabase.co
- **Database:** PostgreSQL via Supabase
- **Framework:** React 18 + TypeScript + Vite
- **Query Library:** Supabase JS Client v2.90.1

---

## Quick Reference Commands

### Restart Dev Server
```bash
# If needed to force code reload
npm run dev
```

### Check Supabase Connection
Open browser console and run:
```javascript
console.log(window.supabase)
```

### SQL Query to Verify Data
```sql
SELECT we.*, ec.name
FROM workout_exercises we
LEFT JOIN exercise_cards ec ON ec.id = we.exercise_card_id
WHERE we.workout_id = '3b0c33f3-b14d-4b1c-92e6-2adb01d6300f'
ORDER BY we.exercise_order;
```

---

## Contact Points for Tomorrow

1. Start by checking Network tab for actual API response
2. Verify the `console.error` debug logs appear (hard refresh if needed)
3. If still not working, try the direct Supabase query in browser console
4. Consider alternative query approach if nested select is the issue

**Remember:** The data is definitely in the database and properly structured. This is 100% a query/retrieval issue, not a data issue.
