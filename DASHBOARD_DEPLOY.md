# Deploy via Supabase Dashboard - Step by Step

Since the CLI is having authentication issues, let's deploy directly through the web dashboard.

## Step 1: Set Up Secrets (Environment Variables)

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/settings/functions
2. Scroll to "Secrets" section
3. Click "Add secret"
4. Name: `GEMINI_API_KEY`
5. Value: `AIzaSyDMJqf3KrqMzP6JzinsO5PvNzz241bNA-0`
6. Click "Save"

## Step 2: Run Database Migration

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/editor
2. Click "New query"
3. Paste this SQL:

```sql
-- Add screenshot_urls column to exercise_cards
ALTER TABLE exercise_cards
ADD COLUMN IF NOT EXISTS screenshot_urls JSONB;

COMMENT ON COLUMN exercise_cards.screenshot_urls IS
  'Array of image URLs for extracted video frames: ["https://...", "https://..."]';

-- Create storage bucket for exercise screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-screenshots', 'exercise-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-screenshots');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-screenshots'
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Service role can manage screenshots"
ON storage.objects FOR ALL
USING (bucket_id = 'exercise-screenshots' AND auth.role() = 'service_role');
```

4. Click "Run" or press Ctrl+Enter

## Step 3: Deploy analyze-video Function

1. Go to: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/functions
2. Click "Create a new function"
3. Function name: `analyze-video`
4. Copy the entire code from: `supabase/functions/analyze-video/index.ts`
5. Paste into the editor
6. Click "Deploy"

## Step 4: Deploy extract-frames Function

1. Still in: https://supabase.com/dashboard/project/xaknhwxfkcxtqjkwkccn/functions
2. Click "Create a new function"
3. Function name: `extract-frames`
4. Copy the entire code from: `supabase/functions/extract-frames/index.ts`
5. Paste into the editor
6. Click "Deploy"

## Step 5: Test the Functions

Test with curl:

```bash
curl -X POST 'https://xaknhwxfkcxtqjkwkccn.supabase.co/functions/v1/analyze-video' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhha25od3hma2N4dHFqa3drY2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjIzNDQsImV4cCI6MjA4NDIzODM0NH0.b2FR0JsLbcuuvW8-L4IgYNh9Zm_k9JKjw2qtunPUe50' \
  -H 'Content-Type: application/json' \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=uYumuL_G_V0",
    "sport": "strength"
  }'
```

Or use the React component in your app:

```tsx
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'

<VideoAnalysisForm />
```

## Done!

Your video analysis service is now deployed and ready to use!
