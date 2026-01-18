# Utility Scripts

This directory contains utility scripts for database management and data import tasks.

## Exercise Video Import Script

**File:** `import-exercise-videos.ts`

Imports exercise demonstration videos and instructional content from YouTube URLs and updates existing exercise_cards in the database.

### Prerequisites

1. **Environment Variables**

   Ensure your `.env.local` file has:
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key

   # Optional: For admin operations (if RLS is enabled)
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Dependencies**

   The required dependencies are already installed:
   - `@supabase/supabase-js` - Database client
   - `tsx` - TypeScript executor

   The script reads `.env.local` directly using Node's built-in `fs` module, so no additional packages are needed.

### Usage

Run the script from the project root:

```bash
npm run import-videos
```

### What It Does

1. **Loads Exercise Mappings** - Reads hardcoded exercise-to-video mappings
2. **Fetches Exercise Cards** - Retrieves all exercises from the database
3. **Fuzzy Matching** - Finds matching exercises even with slight name variations
4. **Updates Database** - Adds video URLs, timestamps, instructions, and coaching cues
5. **Reports Results** - Shows success/failure summary with details

### Output Example

```
🎥 Starting Exercise Video Import...
============================================================

📋 Fetching exercise cards from database...
✅ Found 65 exercise cards

🔍 Validating YouTube URLs...
✅ All URLs valid

📝 Processing video mappings...

✅ Front Squat → Front Squat (+5 instructions) (+4 cues)
✅ Back Squat → Back Squat (+5 instructions) (+4 cues)
✅ RDL → Single Leg RDL (+5 instructions) (+4 cues)
❌ Unknown Exercise: No matching exercise card found
✅ Box Jump → Box Jump (+5 instructions) (+4 cues)

============================================================
📊 Import Summary
============================================================
✅ Successfully updated: 42
❌ Failed: 3
📝 Total exercises in database: 65
🎯 Attempted to update: 45

🔄 Fuzzy Matches (mapping → database):
  "RDL" → "Single Leg RDL"
  "Nordic Curl" → "Nordic Hamstring Curl"

❌ Failed Exercises:
  - Unknown Exercise: No matching exercise card found
  - Another Missing Exercise: No matching exercise card found

============================================================
✨ Script completed
```

### Features

#### 1. Fuzzy Matching

The script uses multiple strategies to match exercise names:

- **Exact match** - `"Front Squat"` → `"Front Squat"`
- **Partial match** - `"RDL"` → `"Single Leg RDL"`
- **Short name match** - Uses `exercise_cards.short_name` field
- **Cleaned match** - Removes parentheses and extra spaces

#### 2. YouTube URL Validation

Validates all URLs before processing:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

#### 3. Comprehensive Data

Each mapping can include:

```typescript
{
  url: string                // YouTube demonstration URL
  start_time?: string        // Optional: "1:30" format
  end_time?: string          // Optional: "2:45" format
  instructions?: string[]    // Step-by-step how-to
  coaching_cues?: string[]   // Key teaching points
}
```

### Adding New Exercises

To add more exercises, edit the `exerciseVideoMappings` object in `import-exercise-videos.ts`:

```typescript
const exerciseVideoMappings: Record<string, VideoData> = {
  'Your Exercise Name': {
    url: 'https://www.youtube.com/watch?v=VIDEO_ID',
    start_time: '0:30', // Optional
    instructions: [
      'Step 1',
      'Step 2',
      'Step 3'
    ],
    coaching_cues: [
      'Cue 1',
      'Cue 2'
    ]
  },
  // ... more exercises
}
```

### Troubleshooting

**Error: "Missing VITE_SUPABASE_URL environment variable"**
- Check that `.env.local` exists and contains the required variables
- Make sure you're running from the project root directory

**Error: "Failed to fetch exercise cards"**
- Verify Supabase credentials are correct
- Check that the `exercise_cards` table exists
- If RLS is enabled, ensure you have proper permissions

**Warning: "Invalid URL"**
- Check that YouTube URLs are formatted correctly
- URLs must start with `https://`

**Exercise not matched**
- Check the exact name in the database (run: `SELECT name FROM exercise_cards`)
- Try adding the `short_name` to your mapping
- Consider updating the fuzzy matching logic

### Database Schema

The script updates these `exercise_cards` fields:

```sql
CREATE TABLE exercise_cards (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  video_url TEXT,              -- Updated by script
  video_start_time TEXT,       -- Updated by script
  video_end_time TEXT,         -- Updated by script
  instructions TEXT[],         -- Updated by script
  coaching_cues TEXT[],        -- Updated by script
  -- ... other fields
)
```

### Next Steps

After running the import:

1. **Verify Updates** - Check the database to ensure videos were added
2. **Test ExerciseCardModal** - Open workouts and view exercise details
3. **Add More Videos** - Continue adding YouTube URLs for remaining exercises
4. **Update Instructions** - Refine coaching cues based on coach feedback

### Development Notes

- The script uses the Supabase service role key (or anon key) for updates
- All updates are transactional - failures don't affect other exercises
- The script is idempotent - safe to run multiple times
- Existing data is overwritten with new mappings

### Related Files

- `src/components/workout/ExerciseCardModal.tsx` - Displays video content
- `supabase/seed.sql` - Creates exercise cards
- `src/lib/queries.ts` - Database query functions
