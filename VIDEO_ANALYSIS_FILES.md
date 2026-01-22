# Video Analysis Service - Complete File List

All files created for the video analysis service implementation.

## 📁 Project Structure

```
banditstracker/
├── supabase/
│   ├── functions/
│   │   ├── analyze-video/
│   │   │   └── index.ts                    # Main video analysis Edge Function
│   │   └── extract-frames/
│   │       └── index.ts                    # Frame extraction Edge Function
│   └── migrations/
│       └── 002_add_screenshot_urls.sql     # Database migration
│
├── src/
│   ├── types/
│   │   └── video-analysis.ts               # TypeScript type definitions
│   │
│   ├── services/
│   │   └── video-analysis.ts               # Service layer functions
│   │
│   ├── components/
│   │   └── admin/
│   │       ├── VideoAnalysisForm.tsx       # Video submission form
│   │       └── ExerciseLibraryBrowser.tsx  # Exercise library browser
│   │
│   └── pages/
│       └── AdminExerciseLibrary.example.tsx # Complete admin page example
│
├── VIDEO_ANALYSIS_SETUP.md                 # Complete setup guide
├── QUICK_DEPLOY.md                         # 5-minute quick start
├── VIDEO_ANALYSIS_SUMMARY.md               # Implementation summary
└── VIDEO_ANALYSIS_FILES.md                 # This file
```

---

## 🔧 Backend Files

### Edge Functions

#### 1. `supabase/functions/analyze-video/index.ts`
**Purpose:** Main video analysis service
**What it does:**
- Accepts YouTube URL + optional sport
- Calls Google Gemini API
- Parses AI response (JSON)
- Saves exercises to database

**API Endpoint:**
```
POST https://your-project.supabase.co/functions/v1/analyze-video
Body: { "videoUrl": "...", "sport": "..." }
```

**Key Functions:**
- `analyzeVideoWithGemini()` - Call Gemini API
- `buildAnalysisPrompt()` - Generate AI prompt
- `saveExerciseCards()` - Save to database
- `inferExerciseType()` - Determine exercise category
- `shouldTrackWeight/Reps/Duration/Distance()` - Set tracking flags

---

#### 2. `supabase/functions/extract-frames/index.ts`
**Purpose:** Extract video frames at timestamps
**What it does:**
- Two methods: YouTube thumbnails (free) or Shotstack (precise)
- Downloads/generates frame images
- Uploads to Supabase Storage
- Updates exercise card with image URLs

**API Endpoint:**
```
POST https://your-project.supabase.co/functions/v1/extract-frames
Body: {
  "videoUrl": "...",
  "timestamps": ["00:15", "01:30"],
  "exerciseId": "uuid",
  "method": "thumbnail" | "shotstack"
}
```

**Key Functions:**
- `extractFrameWithShotstack()` - Precise timestamp extraction
- `getYouTubeThumbnail()` - Get YouTube thumbnail
- `uploadImageToStorage()` - Upload to Supabase Storage
- `timestampToSeconds()` - Convert MM:SS to seconds

---

### Database

#### 3. `supabase/migrations/002_add_screenshot_urls.sql`
**Purpose:** Add screenshot URL storage support
**What it does:**
- Adds `screenshot_urls` JSONB column to `exercise_cards`
- Creates `exercise-screenshots` storage bucket
- Sets up RLS policies for public/authenticated access

**SQL Changes:**
```sql
ALTER TABLE exercise_cards
ADD COLUMN screenshot_urls JSONB;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-screenshots', 'exercise-screenshots', true);
```

---

## 💻 Frontend Files

### TypeScript Types

#### 4. `src/types/video-analysis.ts`
**Purpose:** Type-safe interfaces for video analysis
**What it defines:**
- `AnalyzeVideoRequest` - API request payload
- `AnalyzeVideoResponse` - API response structure
- `ExtractFramesRequest/Response` - Frame extraction types
- `ExerciseCardWithVideo` - Full exercise card type
- `VideoAnalysisJob` - Job status tracking
- `EdgeFunctionError` - Error response type

---

### Service Layer

#### 5. `src/services/video-analysis.ts`
**Purpose:** Reusable business logic for entire app
**Functions provided:**

**Video Analysis:**
- `analyzeVideo(videoUrl, sport)` - Analyze and save to DB
- `extractFrames(videoUrl, timestamps, exerciseId, method)` - Extract frames
- `analyzeAndExtractFrames(videoUrl, sport, method)` - Complete workflow

**Exercise Library:**
- `getExerciseCardsWithVideo(filters)` - Fetch exercises with filters
- `searchExercises(searchTerm, filters)` - Search by keywords
- `getExerciseCard(id)` - Get single exercise
- `updateExerciseVideo(exerciseId, updates)` - Manual updates

**Utilities:**
- `validateYouTubeUrl(url)` - URL validation
- `extractYouTubeVideoId(url)` - Parse video ID
- `getYouTubeThumbnail(url, quality)` - Get thumbnail URL

---

### React Components

#### 6. `src/components/admin/VideoAnalysisForm.tsx`
**Purpose:** Form for submitting videos for analysis
**Features:**
- YouTube URL input with validation
- Sport selection dropdown
- Real-time progress indicator
- Success/error feedback
- Shows analyzed exercises in result

**Props:**
```typescript
interface VideoAnalysisFormProps {
  onSuccess?: (exercises) => void
  onError?: (error: string) => void
}
```

**Usage:**
```tsx
<VideoAnalysisForm
  onSuccess={(exercises) => {
    console.log('Added exercises:', exercises)
  }}
/>
```

---

#### 7. `src/components/admin/ExerciseLibraryBrowser.tsx`
**Purpose:** Browse/search exercise library
**Features:**
- Search bar with live filtering
- Difficulty filter dropdown
- Exercise list with thumbnails
- Detailed view with video player
- Shows instructions, coaching cues, screenshots
- Displays tracking settings

**Props:**
```typescript
interface ExerciseLibraryBrowserProps {
  onSelectExercise?: (exercise) => void
  filterByVideo?: boolean
}
```

**Usage:**
```tsx
<ExerciseLibraryBrowser
  onSelectExercise={(ex) => addToWorkout(ex)}
  filterByVideo={true}
/>
```

---

#### 8. `src/pages/AdminExerciseLibrary.example.tsx`
**Purpose:** Complete example admin page
**Features:**
- Tab navigation (Browse / Add)
- Integrated video analysis form
- Exercise library browser
- Quick start instructions
- Example video links
- Alternative side-by-side layout

**Usage:**
Copy this file to create your actual admin page:
```bash
cp src/pages/AdminExerciseLibrary.example.tsx src/pages/AdminExerciseLibrary.tsx
```

---

## 📚 Documentation

#### 9. `VIDEO_ANALYSIS_SETUP.md`
**Purpose:** Complete setup and deployment guide
**Sections:**
- Architecture overview
- Prerequisites
- Step-by-step setup (7 steps)
- Testing instructions (3 options)
- Usage examples
- Environment variables
- Cost breakdown
- Troubleshooting
- Advanced customization

**Read this:** For full setup instructions

---

#### 10. `QUICK_DEPLOY.md`
**Purpose:** 5-minute quick start guide
**Sections:**
- Get Gemini API key (2 min)
- Install Supabase CLI (1 min)
- Configure project (2 min)
- Deploy everything (1 min)
- Test it works (30 sec)
- Troubleshooting commands

**Read this:** To get running fast

---

#### 11. `VIDEO_ANALYSIS_SUMMARY.md`
**Purpose:** Implementation overview and comparison
**Sections:**
- What we built vs what PDFs suggested
- Files created with explanations
- Key features
- Integration points
- Workflow comparison (before/after)
- Cost analysis
- Advantages over n8n
- Next steps

**Read this:** To understand the architecture

---

#### 12. `VIDEO_ANALYSIS_FILES.md`
**Purpose:** Complete file reference (this file)
**Sections:**
- Project structure
- File descriptions
- Usage examples
- Quick links

**Read this:** For quick reference

---

## 🚀 Quick Links

### Setup & Deployment
- **Quick Start:** `QUICK_DEPLOY.md`
- **Full Setup:** `VIDEO_ANALYSIS_SETUP.md`
- **Overview:** `VIDEO_ANALYSIS_SUMMARY.md`

### Code Reference
- **Edge Functions:** `supabase/functions/*/index.ts`
- **Service Layer:** `src/services/video-analysis.ts`
- **UI Components:** `src/components/admin/*`
- **Example Page:** `src/pages/AdminExerciseLibrary.example.tsx`

### Types & Schema
- **TypeScript Types:** `src/types/video-analysis.ts`
- **Database Migration:** `supabase/migrations/002_add_screenshot_urls.sql`

---

## 📝 Usage Patterns

### Pattern 1: Simple Video Analysis
```typescript
import { analyzeVideo } from '@/services/video-analysis'

const result = await analyzeVideo('https://youtube.com/watch?v=...')
console.log('Added exercises:', result.database.exercises)
```

### Pattern 2: With Frame Extraction
```typescript
import { analyzeAndExtractFrames } from '@/services/video-analysis'

const { analysis, frames } = await analyzeAndExtractFrames(
  'https://youtube.com/watch?v=...',
  'baseball',
  'thumbnail' // or 'shotstack'
)
```

### Pattern 3: Search Exercises
```typescript
import { searchExercises } from '@/services/video-analysis'

const exercises = await searchExercises('squat', {
  hasVideo: true,
  difficulty: 'intermediate'
})
```

### Pattern 4: React Component
```tsx
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'

<VideoAnalysisForm
  onSuccess={(exercises) => {
    // Handle success
  }}
/>
```

---

## 🔑 Environment Variables

### Required (Edge Functions - via secrets)
```bash
supabase secrets set GEMINI_API_KEY=your_key_here
```

### Optional (Edge Functions)
```bash
supabase secrets set SHOTSTACK_API_KEY=your_key_here
```

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## ✅ Deployment Checklist

- [ ] Get Gemini API key from https://ai.google.dev
- [ ] Install Supabase CLI
- [ ] Link to Supabase project: `supabase link`
- [ ] Set Gemini secret: `supabase secrets set GEMINI_API_KEY=...`
- [ ] Run migration: `supabase db push`
- [ ] Deploy analyze-video: `supabase functions deploy analyze-video`
- [ ] Deploy extract-frames: `supabase functions deploy extract-frames`
- [ ] Test with curl or React component
- [ ] Add `VideoAnalysisForm` to admin panel
- [ ] Test end-to-end workflow

---

## 📊 File Statistics

- **Total Files Created:** 12
- **Edge Functions:** 2
- **React Components:** 3
- **Service Layer:** 1
- **Type Definitions:** 1
- **Database Migrations:** 1
- **Documentation:** 4

**Lines of Code:**
- Backend (Edge Functions): ~800 lines
- Frontend (Components + Services): ~1,200 lines
- Types: ~200 lines
- **Total:** ~2,200 lines

---

## 🎯 Next Steps

1. **Deploy** - Follow `QUICK_DEPLOY.md`
2. **Test** - Use example videos to verify it works
3. **Integrate** - Add components to your admin panel
4. **Customize** - Adjust prompts, UI, etc. to your needs
5. **Scale** - Add more features (bulk import, user submissions, etc.)

---

## 💡 Tips

- Start with the `QUICK_DEPLOY.md` guide
- Use `VIDEO_ANALYSIS_SUMMARY.md` to understand architecture
- Copy `AdminExerciseLibrary.example.tsx` as starting point
- Read `VIDEO_ANALYSIS_SETUP.md` for detailed configuration
- Check function logs: `supabase functions logs analyze-video`

---

**Last Updated:** 2026-01-18
**Version:** 1.0.0
