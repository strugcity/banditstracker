# Quick Deploy Guide - Video Analysis Service

Copy and paste these commands to get the video analysis service running in 5 minutes.

## Prerequisites

- [ ] Supabase project exists
- [ ] Google Gemini API key ready

---

## 1. Get Gemini API Key (2 minutes)

1. Visit: https://ai.google.dev
2. Click "Get API key in Google AI Studio"
3. Click "Create API Key"
4. **Copy the key** (you'll paste it in step 3)

---

## 2. Install Supabase CLI (1 minute)

### Windows (PowerShell)
```powershell
scoop install supabase
```

### Mac/Linux
```bash
brew install supabase/tap/supabase
```

### Verify
```bash
supabase --version
```

---

## 3. Configure Project (2 minutes)

### Link to your Supabase project
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
- Go to https://supabase.com/dashboard
- Click your project
- URL will be: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### Set API key secret
```bash
supabase secrets set GEMINI_API_KEY=paste_your_gemini_key_here
```

---

## 4. Deploy Everything (1 minute)

### Run database migration
```bash
supabase db push
```

### Deploy Edge Functions
```bash
supabase functions deploy analyze-video
supabase functions deploy extract-frames
```

---

## 5. Test It Works (30 seconds)

Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` below:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-video' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=uYumuL_G_V0",
    "sport": "strength"
  }'
```

**Find YOUR_ANON_KEY:**
- Supabase Dashboard → Project Settings → API
- Copy "anon public" key

**Expected response:**
```json
{
  "success": true,
  "analysis": {
    "video_title": "...",
    "exercise_count": 1
  },
  "database": {
    "inserted": 1,
    "exercises": [...]
  }
}
```

---

## 6. Use in Your App (30 seconds)

Add the component to any admin page:

```tsx
import { VideoAnalysisForm } from '@/components/admin/VideoAnalysisForm'

function AdminPage() {
  return (
    <div className="container mx-auto p-8">
      <VideoAnalysisForm />
    </div>
  )
}
```

---

## Troubleshooting

### "GEMINI_API_KEY not configured"
```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase functions deploy analyze-video
```

### "Failed to connect to database"
```bash
supabase db push
```

### "Function not found"
```bash
supabase functions list  # Check if deployed
supabase functions deploy analyze-video  # Redeploy
```

---

## What's Next?

1. ✅ Service is deployed and working
2. 🔄 Add `VideoAnalysisForm` to your admin panel
3. 🔄 Submit a few training videos to test
4. 🔄 Build workout builder UI to use the exercises
5. 🔄 (Optional) Set up frame extraction with Shotstack

**Full documentation:** See `VIDEO_ANALYSIS_SETUP.md`

---

## Costs

- **Gemini API**: FREE (1,500 requests/day)
- **Supabase Edge Functions**: FREE (500K/month)
- **Total**: $0/month for personal use

---

## Support Commands

```bash
# View Edge Function logs
supabase functions logs analyze-video

# Test locally (before deploying)
supabase functions serve

# List all secrets
supabase secrets list

# Update a secret
supabase secrets set GEMINI_API_KEY=new_key
```

---

You're done! 🎉

The video analysis service is now live and ready to process training videos.
