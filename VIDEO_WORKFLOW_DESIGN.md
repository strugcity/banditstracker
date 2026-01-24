# Video-to-Workout Workflow Design

## Problem Statement

The current video analysis service has a gap:
- ✅ Analyzes videos and extracts exercises
- ✅ Saves exercises to the library
- ❌ Doesn't create workouts
- ❌ Doesn't associate exercises with programs
- ❌ No review/approval step before importing

## Proposed Two-Phase Workflow

### Phase 1: Analysis & Review (Staging)

```
User submits video URL
         ↓
   AI analyzes video
         ↓
   Extract exercises
         ↓
┌─────────────────────────────────┐
│  Review Interface (Staging)     │
│  • Edit exercise details        │
│  • Select which to import       │
│  • Choose import destination    │
└─────────────────────────────────┘
```

### Phase 2: Import Decision

```
                    Review Complete
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                   ↓
  Add to Library     Create Workout    Add to Existing Workout
        ↓                  ↓                   ↓
  exercise_cards     exercise_cards      exercise_cards
                           +                   +
                      workouts (new)      workout_exercises
                           +              (append to workout)
                   workout_exercises
```

## User Flow Examples

### Example 1: Building Exercise Library

**Scenario**: Coach finds a great tutorial video with 5 drills

1. Submit video URL
2. Review 5 extracted exercises
3. Edit names: "Medicine Ball Slam" → "Overhead Med Ball Slam"
4. Select 4 exercises to import (skip 1 that's redundant)
5. Click "Add to Library"
6. Exercises saved to `exercise_cards`
7. Available for future workout building

### Example 2: Creating a New Workout from Video

**Scenario**: Found a complete warmup routine video

1. Submit video URL
2. Review 6 extracted exercises (all warmup movements)
3. Click "Create Workout from Video"
4. Fill out workout form:
   - Program: "Gophers Summer 2024"
   - Week: 1
   - Day: "Monday"
   - Name: "Dynamic Warmup"
5. For each exercise, specify:
   - Exercise order: 1, 2, 3, 4, 5, 6
   - Prescribed sets: [{"set": 1, "reps": 10}]
6. Click "Create Workout"
7. System creates:
   - 6 new exercise cards
   - 1 new workout
   - 6 workout_exercise links

### Example 3: Adding Exercises to Existing Workout

**Scenario**: Need to add 2 new plyometric drills to Week 3 workout

1. Submit video URL
2. Review 2 extracted exercises
3. Click "Add to Existing Workout"
4. Select: "Gophers Summer 2024 → Week 3 → Wednesday"
5. Specify exercise order: 7, 8 (append to workout)
6. Specify prescribed sets for each
7. Click "Add to Workout"
8. System creates:
   - 2 new exercise cards
   - 2 workout_exercise links

## Implementation Recommendations

### Backend Changes Needed

#### 1. Create `video_analysis_sessions` table (staging area)

```sql
CREATE TABLE video_analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_url TEXT NOT NULL,
    sport VARCHAR(100),
    analysis_result JSONB NOT NULL,  -- Full Gemini response
    status VARCHAR(20) DEFAULT 'pending',  -- pending, imported, rejected
    created_by UUID,  -- user who initiated
    created_at TIMESTAMPTZ DEFAULT NOW(),
    imported_at TIMESTAMPTZ
);
```

#### 2. Update `analyze-video` Edge Function

Change from auto-save to staging:

```typescript
// OLD: Automatically saves to exercise_cards
const result = await saveExerciseCards(supabase, videoUrl, analysis)

// NEW: Save to staging table
const { data: session } = await supabase
  .from('video_analysis_sessions')
  .insert({
    video_url: videoUrl,
    sport: sport,
    analysis_result: analysis,
    status: 'pending'
  })
  .select()
  .single()

return { sessionId: session.id, analysis }
```

#### 3. Create new Edge Functions

**`import-to-library`**
- Takes: `sessionId`, `selectedExerciseIds[]`
- Creates: exercise cards only
- Updates session status to 'imported'

**`create-workout-from-video`**
- Takes: `sessionId`, `workoutData`, `exercisePrescriptions[]`
- Creates: exercise cards + workout + workout_exercises
- Updates session status to 'imported'

**`add-to-workout`**
- Takes: `sessionId`, `workoutId`, `exercisePrescriptions[]`
- Creates: exercise cards + workout_exercises (append)
- Updates session status to 'imported'

### Frontend Changes Needed

#### 1. Update `VideoAnalysisForm.tsx`

```tsx
// Instead of showing "Success!" immediately
// Navigate to review page with sessionId
onSuccess={(sessionId) => {
  router.push(`/admin/video-review/${sessionId}`)
}}
```

#### 2. Create `VideoReviewPage.tsx`

Multi-step wizard:
1. **Review Exercises** - Edit names, instructions, cues, select which to import
2. **Choose Destination** - Library only, New workout, Existing workout
3. **Configure** (if creating/adding to workout) - Prescriptions, order, etc.
4. **Confirm & Import** - Final review before saving

#### 3. Create `ExerciseReviewCard.tsx`

Individual exercise review component:
- Checkbox to select/deselect
- Inline editing of name, instructions, cues
- Preview of video segment
- Screenshot thumbnails

## Database Schema Updates

### New Table: video_analysis_sessions

```sql
CREATE TABLE IF NOT EXISTS video_analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_url TEXT NOT NULL,
    sport VARCHAR(100),
    video_title TEXT,
    total_duration VARCHAR(10),

    -- Full AI response stored as JSONB
    analysis_result JSONB NOT NULL,

    -- Session status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending: awaiting user review
    -- imported: exercises imported to library/workout
    -- rejected: user decided not to import

    -- Metadata
    created_by UUID,  -- Future: reference to users table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    imported_at TIMESTAMPTZ,

    -- Import tracking
    import_type VARCHAR(50),  -- 'library', 'new_workout', 'existing_workout'
    imported_to_workout_id UUID REFERENCES workouts(id),
    imported_exercise_ids JSONB  -- Array of exercise_card IDs created
);

COMMENT ON TABLE video_analysis_sessions IS 'Staging area for video analysis before importing to library';
```

## Migration Path

### Immediate (Current State)
- Keep auto-save behavior for quick testing
- Use for POC and internal testing

### Short-term (Recommended Next Step)
1. Add `video_analysis_sessions` table
2. Update `analyze-video` to save to staging
3. Build simple review UI that just shows results + "Import to Library" button
4. Add `import-to-library` function

### Long-term (Full Workflow)
1. Build full wizard UI with all import options
2. Add `create-workout-from-video` function
3. Add `add-to-workout` function
4. Add batch operations (analyze multiple videos)

## Benefits of Staged Approach

✅ **User Control** - Review before committing to database
✅ **Error Correction** - Fix AI mistakes before importing
✅ **Flexibility** - Multiple import destinations
✅ **Audit Trail** - Track what videos created which exercises
✅ **Undo Capability** - Keep original analysis if import goes wrong
✅ **Batch Processing** - Queue multiple videos for review

## Questions for User

1. **Immediate need**: Do you want to keep the auto-save behavior for now, or implement staging immediately?

2. **Primary use case**: What's your most common workflow?
   - Building exercise library from video tutorials?
   - Creating complete workouts from training videos?
   - Adding specific drills to existing workouts?

3. **Approval process**: Should there be an approval step, or trust the AI output?

4. **Multi-user**: Will multiple coaches be analyzing videos, or just you for now?

5. **Video ownership**: Should videos be tagged with who imported them?
