/**
 * Supabase Edge Function: extract-frames
 *
 * Extracts video frames at specific timestamps and uploads to Supabase Storage
 *
 * This function uses the Shotstack API for serverless video frame extraction.
 * Alternative: You can use FFmpeg in a Docker container or separate microservice.
 *
 * Usage:
 *   POST /extract-frames
 *   Body: {
 *     "videoUrl": "https://youtube.com/...",
 *     "timestamps": ["00:15", "01:30", "02:45"],
 *     "exerciseId": "uuid"
 *   }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Convert MM:SS timestamp to seconds
 */
function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

/**
 * Extract frame using Shotstack API
 */
async function extractFrameWithShotstack(
  videoUrl: string,
  timestampSeconds: number,
  shotstackApiKey: string
): Promise<string> {
  // Create render for frame extraction
  const renderPayload = {
    timeline: {
      tracks: [
        {
          clips: [
            {
              asset: {
                type: 'video',
                src: videoUrl,
                trim: timestampSeconds
              },
              start: 0,
              length: 0.04 // Extract single frame (1 frame at 25fps)
            }
          ]
        }
      ]
    },
    output: {
      format: 'jpg',
      resolution: 'hd'
    }
  }

  // Submit render
  const renderResponse = await fetch('https://api.shotstack.io/v1/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': shotstackApiKey
    },
    body: JSON.stringify(renderPayload)
  })

  if (!renderResponse.ok) {
    const error = await renderResponse.text()
    throw new Error(`Shotstack render failed: ${error}`)
  }

  const renderData = await renderResponse.json()
  const renderId = renderData.response.id

  // Poll for completion
  let attempts = 0
  const maxAttempts = 30 // 30 seconds max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      headers: {
        'x-api-key': shotstackApiKey
      }
    })

    const statusData = await statusResponse.json()

    if (statusData.response.status === 'done') {
      return statusData.response.url
    }

    if (statusData.response.status === 'failed') {
      throw new Error('Frame extraction failed')
    }

    attempts++
  }

  throw new Error('Frame extraction timeout')
}

/**
 * Alternative: YouTube thumbnail extraction (simpler but less precise)
 */
function getYouTubeThumbnail(videoUrl: string, quality: 'default' | 'hq' | 'mq' | 'sd' = 'hq'): string | null {
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  if (!videoIdMatch) return null

  const videoId = videoIdMatch[1]
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`
}

/**
 * Download image from URL and upload to Supabase Storage
 */
async function uploadImageToStorage(
  supabase: any,
  imageUrl: string,
  exerciseId: string,
  timestamp: string
): Promise<string> {
  // Download image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`)
  }

  const imageBlob = await imageResponse.blob()
  const fileName = `${exerciseId}/${timestamp.replace(':', '-')}.jpg`

  // Upload to Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('exercise-screenshots')
    .upload(fileName, imageBlob, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('exercise-screenshots')
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}

/**
 * Main handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { videoUrl, timestamps, exerciseId, method = 'thumbnail' } = await req.json()

    if (!videoUrl || !timestamps || !exerciseId) {
      return new Response(
        JSON.stringify({
          error: 'videoUrl, timestamps, and exerciseId are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const extractedUrls: string[] = []

    // Method 1: YouTube thumbnail (fast, free, but not timestamp-specific)
    if (method === 'thumbnail') {
      const thumbnailUrl = getYouTubeThumbnail(videoUrl, 'hq')
      if (thumbnailUrl) {
        // Upload the same thumbnail for all timestamps (good for POC)
        for (const timestamp of timestamps) {
          const uploadedUrl = await uploadImageToStorage(
            supabase,
            thumbnailUrl,
            exerciseId,
            timestamp
          )
          extractedUrls.push(uploadedUrl)
        }
      }
    }

    // Method 2: Shotstack API (precise, paid)
    else if (method === 'shotstack') {
      const shotstackApiKey = Deno.env.get('SHOTSTACK_API_KEY')
      if (!shotstackApiKey) {
        throw new Error('SHOTSTACK_API_KEY not configured')
      }

      for (const timestamp of timestamps) {
        const seconds = timestampToSeconds(timestamp)
        const frameUrl = await extractFrameWithShotstack(videoUrl, seconds, shotstackApiKey)
        const uploadedUrl = await uploadImageToStorage(supabase, frameUrl, exerciseId, timestamp)
        extractedUrls.push(uploadedUrl)
      }
    }

    // Update exercise_cards with screenshot URLs
    const { error: updateError } = await supabase
      .from('exercise_cards')
      .update({ screenshot_urls: extractedUrls })
      .eq('id', exerciseId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        screenshot_urls: extractedUrls,
        method: method
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in extract-frames function:', error)

    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
