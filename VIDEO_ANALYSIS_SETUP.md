# Video Analysis Service Setup Guide

This guide walks you through setting up the AI-powered video analysis service that automatically extracts exercises, instructions, and coaching cues from training videos.

## Architecture Overview

```
YouTube URL → Gemini API (AI Analysis) → Supabase Edge Function → Database
                                              ↓
                                    Frame Extraction (optional)
                                              ↓
                                    Supabase Storage (images)
```

## Prerequisites

1. **Supabase Project** - Already set up ✅
2. **Google Gemini API Key** - Free tier: 1,500 requests/day
3. **Supabase CLI** - For deploying Edge Functions
4. **Optional: Shotstack API Key** - For precise frame extraction (or use free YouTube thumbnails)

---

## Step 1: Get Google Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev)
2. Click **"Get API key in Google AI Studio"**
3. Click **"Create API Key"**
4. Copy the API key (you'll need it in Step 3)

**Free Tier Limits:**
- 1,500 requests per day
- Videos up to 2 hours long
- Direct YouTube URL support (8 hours/day max)

---

## Step 2: Install Supabase CLI

### Windows (PowerShell)
```powershell
scoop install supabase
```

Or download from: https://github.com/supabase/cli/releases

### Verify Installation
```bash
supabase --version
```

### Login to Supabase
```bash
supabase login
```

---

## Step 3: Configure Edge Function Secrets

Edge Functions need API keys stored as secrets (not in code).

```bash
# Set Gemini API Key
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Set Shotstack API Key (if using precise frame extraction)
supabase secrets set SHOTSTACK_API_KEY=your_shotstack_key_here
```

**Note:** Secrets are automatically available to all Edge Functions as environment variables.

---

## Step 4: Run Database Migration

Apply the migration to add `screenshot_urls` support:

```bash
supabase db push
```

This will:
- Add `screenshot_urls` column to `exercise_cards` table
- Create `exercise-screenshots` storage bucket
- Set up Row Level Security (RLS) policies

**Manual Alternative (if needed):**
```bash
supabase db reset
```

---

## Step 5: Deploy Edge Functions

### Deploy Both Functions
```bash
supabase functions deploy analyze-video
supabase functions deploy extract-frames
```

### Verify Deployment
```bash
supabase functions list
```

You should see:
- `analyze-video` (status: active)
- `extract-frames` (status: active)

---

## Step 6: Test the Service

### Option A: Using the React UI

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the admin panel and import the component:
```tsx
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'

function AdminPage() {
  return (
    <div>
      <h1>Exercise Library Management</h1>
      <VideoAnalysisForm
        onSuccess={(exercises) => {
          console.log('Exercises added:', exercises)
        }}
      />
    </div>
  )
}
```

3. Submit a YouTube URL of a training video

### Option B: Using curl (Direct API Test)

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/analyze-video' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=VIDEO_ID",
    "sport": "baseball"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "video_title": "Baseball Pitching Mechanics",
    "sport": "baseball",
    "total_duration": "05:30",
    "exercise_count": 3
  },
  "database": {
    "inserted": 3,
    "updated": 0,
    "exercises": [
      {
        "id": "uuid",
        "name": "Medicine Ball Slam",
        "difficulty": "intermediate",
        "equipment": ["medicine ball"]
      }
    ]
  }
}
```

### Option C: Using the Service Layer

```typescript
import { analyzeVideo } from '@/services/video-analysis'

async function analyzeTrainingVideo() {
  try {
    const result = await analyzeVideo(
      'https://youtube.com/watch?v=VIDEO_ID',
      'baseball'
    )

    console.log('Added exercises:', result.database.exercises)
  } catch (error) {
    console.error('Analysis failed:', error)
  }
}
```

---

## Step 7: Extract Video Frames (Optional)

By default, the service uses YouTube thumbnails (free, instant). For timestamp-specific frames:

### Option 1: YouTube Thumbnails (Default)
```typescript
import { extractFrames } from '@/services/video-analysis'

const result = await extractFrames(
  videoUrl,
  ['00:15', '01:30', '02:45'],
  exerciseId,
  'thumbnail' // Free, but not timestamp-specific
)
```

### Option 2: Shotstack API (Precise, Paid)

1. Sign up at [Shotstack](https://shotstack.io)
2. Get API key from dashboard
3. Set secret: `supabase secrets set SHOTSTACK_API_KEY=your_key`
4. Use in code:

```typescript
const result = await extractFrames(
  videoUrl,
  ['00:15', '01:30', '02:45'],
  exerciseId,
  'shotstack' // Precise timestamps, ~$0.01 per frame
)
```

---

## Usage in Your App

### 1. Add Video Analysis to Admin Panel

```tsx
// src/pages/AdminExerciseLibrary.tsx
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'

export function AdminExerciseLibrary() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Exercise Library</h1>

      <VideoAnalysisForm
        onSuccess={(exercises) => {
          // Show success notification
          alert(`Added ${exercises.length} exercises!`)
        }}
      />

      {/* Exercise list component here */}
    </div>
  )
}
```

### 2. Search and Display Exercises

```tsx
import { searchExercises } from '@/services/video-analysis'
import { useState, useEffect } from 'react'

export function ExerciseSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (query.length > 2) {
      searchExercises(query, { hasVideo: true }).then(setResults)
    }
  }, [query])

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises..."
      />

      <div className="grid gap-4 mt-4">
        {results.map(exercise => (
          <div key={exercise.id} className="border p-4 rounded">
            <h3 className="font-bold">{exercise.name}</h3>
            <p className="text-sm text-gray-600">{exercise.difficulty}</p>

            {/* Display video and instructions */}
            {exercise.video_url && (
              <a href={exercise.video_url} target="_blank">
                Watch Video
              </a>
            )}

            {exercise.instructions && (
              <ol className="mt-2 space-y-1">
                {exercise.instructions.map((step, i) => (
                  <li key={i}>{i + 1}. {step}</li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Integrate with Workout Builder

```tsx
import { getExerciseCardsWithVideo } from '@/services/video-analysis'

export function WorkoutBuilder() {
  const [exercises, setExercises] = useState([])

  useEffect(() => {
    getExerciseCardsWithVideo({ hasVideo: true })
      .then(setExercises)
  }, [])

  const addExerciseToWorkout = (exercise) => {
    // Create workout_exercise record
    // Add to current workout being built
  }

  return (
    <div>
      <h2>Build Your Workout</h2>

      <div className="exercise-library">
        {exercises.map(ex => (
          <div key={ex.id}>
            <h3>{ex.name}</h3>
            <button onClick={() => addExerciseToWorkout(ex)}>
              Add to Workout
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Environment Variables

Make sure these are set in your `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Not needed in frontend (only in Edge Functions via secrets)
# GEMINI_API_KEY - set via: supabase secrets set GEMINI_API_KEY=...
# SHOTSTACK_API_KEY - set via: supabase secrets set SHOTSTACK_API_KEY=...
```

---

## Cost Breakdown

### Free Tier (POC/Personal Use)
- **Gemini API**: FREE (1,500 requests/day)
- **Supabase Edge Functions**: FREE (500K invocations/month)
- **Supabase Storage**: FREE (1GB)
- **Frame Extraction (thumbnails)**: FREE
- **Total**: $0/month

### Production (Paid Features)
- **Gemini API**: ~$0.002 per video (after free tier)
- **Shotstack API**: ~$0.01 per frame extracted
- **Supabase Pro**: $25/month (for more storage/bandwidth)

**Example:** Analyzing 100 videos/month with 3 frames each:
- Gemini: ~$0.20
- Shotstack: $3.00
- Total: ~$3.20/month (plus Supabase if needed)

---

## Troubleshooting

### "GEMINI_API_KEY not configured"
```bash
supabase secrets set GEMINI_API_KEY=your_key_here
supabase functions deploy analyze-video
```

### "Only YouTube URLs are supported"
- Ensure URL format: `https://youtube.com/watch?v=VIDEO_ID`
- Or: `https://youtu.be/VIDEO_ID`

### "Failed to fetch exercise cards"
- Run migration: `supabase db push`
- Check RLS policies in Supabase Dashboard

### Edge Function timeout
- Videos over 2 hours may timeout
- Try shorter video segments
- Increase function timeout in `supabase/functions/analyze-video/index.ts`

### CORS errors
- Edge Functions already include CORS headers
- If issues persist, check browser console for specific error

---

## Next Steps

1. ✅ Set up Gemini API key
2. ✅ Deploy Edge Functions
3. ✅ Run database migration
4. ✅ Test with a sample YouTube video
5. 🔄 Build workout builder UI to use analyzed exercises
6. 🔄 Add bulk video import feature
7. 🔄 Create exercise library browsing interface

---

## Advanced: Custom Prompts

To customize the AI analysis prompt, edit:

**File:** `supabase/functions/analyze-video/index.ts`

**Function:** `buildAnalysisPrompt()`

You can modify it to:
- Focus on specific sports/movements
- Extract additional metadata
- Use different JSON schema
- Include sport-specific terminology

---

## Support

For issues or questions:
1. Check Supabase Edge Function logs: `supabase functions logs analyze-video`
2. Review Gemini API quota: https://ai.google.dev/pricing
3. Test Edge Functions locally: `supabase functions serve`

---

## Summary

You now have a fully functional AI video analysis pipeline that:

✅ Accepts YouTube URLs
✅ Analyzes videos with Gemini AI
✅ Extracts exercises with instructions and coaching cues
✅ Stores in your Supabase database
✅ Optional: Extracts video frames at key timestamps
✅ Ready to integrate with workout builder UI

**Cost:** $0 for POC, ~$3-5/month for production use
