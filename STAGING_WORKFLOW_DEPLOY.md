# Deploy Video Analysis Staging Workflow - Step by Step

This guide will help you deploy the new staging workflow where videos are reviewed before importing to the exercise library.

## What's New?

**Old workflow:**
- Analyze video → Auto-save to exercise_cards

**New workflow (MVP):**
- Analyze video → Save to staging → Review UI → Select exercises → Import to library

## Prerequisites

- Gemini API key already configured ✅
- analyze-video function already deployed ✅
- Database migration 002 already completed ✅

## Step 1: Run Database Migration

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/editor
2. Click "New query"
3. Open the file: `supabase/migrations/003_add_video_staging.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" or press Ctrl+Enter
7. Verify success message

## Step 2: Update analyze-video Edge Function

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/functions
2. Click on "analyze-video" function (or "bright-action")
3. Click "Code" tab
4. Select ALL existing code and DELETE it
5. Open the file: `COPY_THIS_analyze-video-STAGING.txt`
6. Copy ALL the code
7. Paste into the Dashboard editor
8. Click "Deploy"

**What changed:**
- Now saves to `video_analysis_sessions` table instead of `exercise_cards`
- Returns `sessionId` instead of database results
- Response format changed (see below)

## Step 3: Deploy import-to-library Edge Function

1. Still in: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/functions
2. Click "Create a new function"
3. Function name: `import-to-library`
4. Open the file: `supabase/functions/import-to-library/index.ts`
5. Copy ALL the code
6. Paste into the Dashboard editor
7. Click "Deploy"

## Step 4: Add Route to Your App

Add the video review route to your router configuration:

```tsx
// In your main routing file (e.g., App.tsx or router.tsx)
import { VideoReviewPage } from '@/pages/admin/VideoReviewPage'

// Add this route:
<Route path="/admin/video-review/:sessionId" element={<VideoReviewPage />} />
```

## Step 5: Test the New Workflow

### Test 1: Analyze a video

```bash
curl -X POST 'https://xaknhwxfkcxtqjkwkccn.supabase.co/functions/v1/analyze-video' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhha25od3hma2N4dHFqa3drY2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjIzNDQsImV4cCI6MjA4NDIzODM0NH0.b2FR0JsLbcuuvW8-L4IgYNh9Zm_k9JKjw2qtunPUe50' \
  -H 'Content-Type: application/json' \
  -d '{"videoUrl": "https://youtube.com/watch?v=uYumuL_G_V0", "sport": "strength"}'
```

**Expected response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "analysis": {
    "video_title": "The Front Squat",
    "sport": "strength training",
    "total_duration": "00:59",
    "exercise_count": 1
  },
  "exercises": [
    {
      "name": "Front Squat",
      "difficulty": "intermediate",
      "equipment": ["barbell", "weight plates"],
      "start_time": "00:00",
      "end_time": "00:59"
    }
  ]
}
```

**Save the `sessionId`** for the next test.

### Test 2: Check staging table

```sql
SELECT * FROM video_analysis_sessions
WHERE id = 'your-session-id-here'
ORDER BY created_at DESC;
```

You should see:
- `status` = 'pending'
- `analysis_result` contains full JSON
- `imported_exercise_ids` = NULL

### Test 3: Import exercises

```bash
curl -X POST 'https://xaknhwxfkcxtqjkwkccn.supabase.co/functions/v1/import-to-library' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhha25od3hma2N4dHFqa3drY2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjIzNDQsImV4cCI6MjA4NDIzODM0NH0.b2FR0JsLbcuuvW8-L4IgYNh9Zm_k9JKjw2qtunPUe50' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "your-session-id-here",
    "exerciseIndices": [0]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "inserted": 0,
  "updated": 1,
  "exercises": [
    {
      "id": "uuid",
      "name": "Front Squat",
      "difficulty": "intermediate",
      "equipment": ["barbell", "weight plates"]
    }
  ]
}
```

### Test 4: Verify import

Check the staging table again:
```sql
SELECT * FROM video_analysis_sessions
WHERE id = 'your-session-id-here';
```

You should see:
- `status` = 'imported'
- `imported_at` = timestamp
- `imported_exercise_ids` = array of UUIDs

Check the exercise_cards table:
```sql
SELECT * FROM exercise_cards
WHERE name = 'Front Squat';
```

### Test 5: Use the UI

1. Navigate to your VideoAnalysisForm component
2. Submit a YouTube URL
3. Wait for analysis to complete
4. You should be redirected to `/admin/video-review/:sessionId`
5. Review the extracted exercises
6. Select which ones to import
7. Click "Import to Library"
8. Verify success and check exercise_cards table

## Verify Everything Works

Run this query to see all your analysis sessions:

```sql
SELECT
  id,
  video_title,
  status,
  jsonb_array_length(analysis_result->'exercises') as exercise_count,
  created_at,
  imported_at
FROM video_analysis_sessions
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Error: "Session not found"
- Check that the sessionId is correct
- Verify the video_analysis_sessions table exists
- Check RLS policies if using row-level security

### Error: "Invalid exercise index"
- exerciseIndices must be 0-based
- Example: First exercise = [0], first two = [0, 1]

### Error: "Session already imported"
- Each session can only be imported once
- Analyze the video again to create a new session

### Videos analyzed but review page not working
- Check the route is configured: `/admin/video-review/:sessionId`
- Verify VideoReviewPage component is imported
- Check browser console for errors

### Import button disabled
- At least one exercise must be selected
- Check that status is 'pending', not 'imported'

## Migration Notes

If you want to keep the old auto-save behavior temporarily:
1. Don't deploy the updated analyze-video function
2. Keep using the existing version
3. Deploy staging workflow when ready

If you've already tested with the old version:
- Old exercises in exercise_cards will stay there
- New analyses will go to staging
- No conflicts between the two approaches

## Next Steps

After deployment is verified:

1. **Test the full user workflow** - Analyze → Review → Import
2. **Add UI polish** - Loading states, better error messages
3. **Future features:**
   - Edit exercises before importing
   - Batch analyze multiple videos
   - Create workouts directly from videos
   - AI refinement with custom instructions

## File Reference

Created files for this deployment:
- `supabase/migrations/003_add_video_staging.sql`
- `COPY_THIS_analyze-video-STAGING.txt`
- `supabase/functions/import-to-library/index.ts`
- `src/components/admin/ExerciseReviewCard.tsx`
- `src/pages/admin/VideoReviewPage.tsx`
- Updated: `src/components/admin/VideoAnalysisForm.tsx`

## Support

If you encounter issues:
1. Check Supabase function logs
2. Check browser console for errors
3. Verify database migration completed
4. Check Edge Function environment variables
