/**
 * Supabase Edge Function: Ingest Exercise Card
 *
 * This function will be used to fetch exercise information from
 * the video service API and create/update exercise records.
 *
 * Expected to be called when:
 * - User adds a new exercise from video service
 * - Periodic sync of exercise library
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ExerciseCardData {
  name: string
  description?: string
  category?: string
  videoUrl?: string
  thumbnailUrl?: string
  equipment?: string[]
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Get request data
    const { videoServiceId, exerciseData } = await req.json() as {
      videoServiceId?: string
      exerciseData?: ExerciseCardData
    }

    if (!exerciseData) {
      return new Response(
        JSON.stringify({ error: 'Missing exercise data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // TODO: If videoServiceId is provided, fetch from video service API
    // const videoData = await fetchFromVideoService(videoServiceId)

    // Insert or update exercise
    const { data, error } = await supabase
      .from('exercises')
      .upsert({
        name: exerciseData.name,
        description: exerciseData.description,
        category: exerciseData.category || 'other',
        equipment: exerciseData.equipment || [],
        video_url: exerciseData.videoUrl,
        thumbnail_url: exerciseData.thumbnailUrl,
      })
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
