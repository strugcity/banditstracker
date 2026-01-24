# Staging Workflow Deployment Checklist

## ✅ Completed (by Claude)
- [x] Created migration file: `003_add_video_staging.sql`
- [x] Created updated Edge Function: `COPY_THIS_analyze-video-STAGING.txt`
- [x] Created new Edge Function: `import-to-library/index.ts`
- [x] Created React components:
  - [x] `ExerciseReviewCard.tsx`
  - [x] `VideoReviewPage.tsx`
  - [x] Updated `VideoAnalysisForm.tsx`
- [x] Added route to `App.tsx`

## 🔲 YOUR TASKS (Dashboard)

### Task 1: Run Database Migration (2 minutes)

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/editor
2. Click "New query"
3. Copy the SQL below and paste it:

```sql
-- ============================================================================
-- Migration: Add Video Analysis Staging Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_url TEXT NOT NULL,
    video_title TEXT,
    sport VARCHAR(100),
    total_duration VARCHAR(10),
    analysis_result JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    imported_at TIMESTAMPTZ,
    imported_exercise_ids JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_status
    ON video_analysis_sessions(status);

CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_created_at
    ON video_analysis_sessions(created_at DESC);

CREATE TRIGGER update_video_analysis_sessions_updated_at
    BEFORE UPDATE ON video_analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE video_analysis_sessions IS 'Staging area for video analysis before importing to exercise library';
COMMENT ON COLUMN video_analysis_sessions.video_url IS 'YouTube or video URL that was analyzed';
COMMENT ON COLUMN video_analysis_sessions.analysis_result IS 'Full Gemini AI response stored as JSONB';
COMMENT ON COLUMN video_analysis_sessions.status IS 'pending, imported, rejected, or error';
COMMENT ON COLUMN video_analysis_sessions.imported_exercise_ids IS 'Array of exercise_card IDs created from this session';
```

4. Click "Run" (or Ctrl+Enter)
5. ✅ Verify you see "Success. No rows returned"

---

### Task 2: Update analyze-video Function (3 minutes)

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/functions
2. Click on "analyze-video" (or "bright-action")
3. Click "Code" tab
4. **DELETE ALL EXISTING CODE**
5. Open file: `COPY_THIS_analyze-video-STAGING.txt`
6. Copy ALL the code (Ctrl+A, Ctrl+C)
7. Paste into Dashboard
8. Click "Deploy"
9. ✅ Wait for "Deployed successfully"

---

### Task 3: Deploy import-to-library Function (3 minutes)

1. Still in: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/functions
2. Click "Create a new function"
3. Function name: `import-to-library`
4. Open file: `supabase/functions/import-to-library/index.ts`
5. Copy ALL the code
6. Paste into Dashboard
7. Click "Deploy"
8. ✅ Wait for "Deployed successfully"

---

## 🧪 Testing (5 minutes)

### Test 1: Analyze Video (Creates Session)

Dashboard Test Interface:
1. Go to Functions → analyze-video → Test
2. Request Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=uYumuL_G_V0",
  "sport": "strength"
}
```
3. Click "Send Request"
4. ✅ Expected response:
```json
{
  "success": true,
  "sessionId": "SAVE-THIS-UUID",
  "analysis": {
    "video_title": "The Front Squat",
    "sport": "strength training",
    "total_duration": "00:59",
    "exercise_count": 1
  }
}
```
5. **COPY the sessionId** for next test

### Test 2: Check Staging Table

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/editor
2. Run:
```sql
SELECT * FROM video_analysis_sessions ORDER BY created_at DESC LIMIT 1;
```
3. ✅ Should see your session with status = 'pending'

### Test 3: Import Exercises

1. Go to Functions → import-to-library → Test
2. Request Body (use YOUR sessionId):
```json
{
  "sessionId": "YOUR-SESSION-ID-HERE",
  "exerciseIndices": [0]
}
```
3. Click "Send Request"
4. ✅ Expected response:
```json
{
  "success": true,
  "inserted": 0,
  "updated": 1,
  "exercises": [...]
}
```

### Test 4: Verify Import

```sql
SELECT
  id,
  status,
  imported_at,
  imported_exercise_ids
FROM video_analysis_sessions
WHERE id = 'YOUR-SESSION-ID';
```
✅ Should show status = 'imported' and timestamp

---

## 🎯 Final Test: UI Workflow

1. Start your dev server: `npm run dev`
2. Navigate to where you have VideoAnalysisForm
3. Submit a YouTube URL
4. ✅ Should redirect to `/admin/video-review/:sessionId`
5. ✅ Should see all exercises with checkboxes
6. Select exercises
7. Click "Import to Library"
8. ✅ Should see success message
9. Check exercise_cards table to verify import

---

## 📊 Verification Queries

Check all sessions:
```sql
SELECT
  id,
  video_title,
  status,
  jsonb_array_length(analysis_result->'exercises') as exercise_count,
  created_at,
  imported_at
FROM video_analysis_sessions
ORDER BY created_at DESC;
```

Check imported exercises:
```sql
SELECT
  ec.name,
  ec.difficulty,
  ec.video_url,
  ec.created_at
FROM exercise_cards ec
WHERE ec.created_at > NOW() - INTERVAL '1 hour'
ORDER BY ec.created_at DESC;
```

---

## ❌ Troubleshooting

**"Table already exists"**
- Table was created successfully, continue to next step

**"Session not found"**
- Check sessionId is correct
- Run: `SELECT id FROM video_analysis_sessions ORDER BY created_at DESC LIMIT 5;`

**"Invalid exercise index"**
- exerciseIndices are 0-based: first exercise = [0], second = [1]
- To import all: `"exerciseIndices": [0, 1, 2]`

**"Session already imported"**
- Each session can only be imported once
- Analyze video again to create new session

**UI not redirecting**
- Check browser console for errors
- Verify route is in App.tsx: `/admin/video-review/:sessionId`

---

## 🎉 Success Criteria

You're done when:
- [ ] Migration runs without errors
- [ ] analyze-video returns sessionId (not database results)
- [ ] import-to-library successfully imports exercises
- [ ] Staging table shows pending → imported status change
- [ ] UI workflow: submit → review → import works end-to-end

## Next Steps After Deployment

1. Test with multiple exercise videos
2. Try importing partial selections (not all exercises)
3. Add more UI features (edit before import, etc.)
4. Build workout creation from videos

---

Need help? Check function logs in Supabase Dashboard → Functions → Logs
