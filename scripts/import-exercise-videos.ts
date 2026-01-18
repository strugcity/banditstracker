/**
 * Exercise Video Import Script
 *
 * Imports exercise demonstration videos and instructional content
 * from YouTube URLs and updates existing exercise_cards in the database.
 *
 * Usage: npm run import-videos
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
)

// Type definitions
interface ExerciseCard {
  id: string
  name: string
  short_name: string | null
  video_url: string | null
  video_start_time: string | null
  video_end_time: string | null
  instructions: string[] | null
  coaching_cues: string[] | null
}

interface VideoData {
  url: string
  start_time?: string
  end_time?: string
  instructions?: string[]
  coaching_cues?: string[]
}

/**
 * Exercise Video Mappings
 *
 * Maps exercise names to YouTube demonstration URLs and instructional content.
 * Based on the Baseball Pitcher Lifting Program and common strength training resources.
 */
const exerciseVideoMappings: Record<string, VideoData> = {
  // MAIN LIFTS
  'Front Squat': {
    url: 'https://www.youtube.com/watch?v=uYumuL_G_V0',
    instructions: [
      'Set barbell at shoulder height in squat rack',
      'Position bar across front delts with elbows high',
      'Descend keeping chest up and elbows elevated',
      'Squat to full depth maintaining upright torso',
      'Drive through mid-foot to return to start position'
    ],
    coaching_cues: [
      'Keep elbows high throughout entire movement',
      'Maintain upright torso - don\'t lean forward',
      'Full depth with control and stability',
      'Drive knees out to track over toes'
    ]
  },

  'Back Squat': {
    url: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    instructions: [
      'Position barbell on upper traps/rear delts',
      'Hands just outside shoulders, elbows back',
      'Unrack and step back with feet shoulder-width',
      'Descend by sitting back and down',
      'Drive through heels to stand'
    ],
    coaching_cues: [
      'Chest up, core braced throughout',
      'Knees track over toes',
      'Full depth - hip crease below knee',
      'Explosive drive up from bottom'
    ]
  },

  'Trap Bar Deadlift': {
    url: 'https://www.youtube.com/watch?v=WQYAxWQ7ZJk',
    instructions: [
      'Step inside trap bar, feet hip-width apart',
      'Hinge at hips and grasp handles',
      'Chest up, shoulders back, engage lats',
      'Drive through floor explosively',
      'Stand tall, squeeze glutes at top'
    ],
    coaching_cues: [
      'Maintain neutral spine - no rounding',
      'Push floor away vs pulling bar up',
      'Full hip extension at top',
      'Control descent - don\'t drop'
    ]
  },

  // POSTERIOR CHAIN
  'Nordic Hamstring Curl': {
    url: 'https://www.youtube.com/watch?v=r9GUoHH__QY',
    start_time: '0:15',
    instructions: [
      'Kneel on pad with ankles secured',
      'Start in tall kneeling position',
      'Slowly lower body forward under control',
      'Catch yourself with hands when needed',
      'Push off ground to return to start'
    ],
    coaching_cues: [
      'Resist the descent as long as possible',
      'Keep hips extended - straight line from knees to shoulders',
      'Don\'t break at hips',
      'Eccentric focus - lowering is the key'
    ]
  },

  'Glute Ham Raise': {
    url: 'https://www.youtube.com/watch?v=lYc1jC6c7iI',
    instructions: [
      'Secure ankles in GHR machine',
      'Start with torso vertical',
      'Lower torso forward maintaining neutral spine',
      'Pull yourself back up using hamstrings',
      'Squeeze glutes at top position'
    ],
    coaching_cues: [
      'Neutral spine throughout - no rounding',
      'Glutes and hamstrings working together',
      'Control the eccentric',
      'Full range of motion'
    ]
  },

  'Single Leg RDL': {
    url: 'https://www.youtube.com/watch?v=WZNhSPfW21o',
    instructions: [
      'Stand on one leg holding dumbbell',
      'Hinge at hip, extending free leg behind',
      'Lower weight toward ground keeping back flat',
      'Feel stretch in standing leg hamstring',
      'Return to start by squeezing glute'
    ],
    coaching_cues: [
      'Keep hips square - don\'t rotate',
      'Slight bend in standing knee',
      'Neutral spine maintained',
      'Balance and control over speed'
    ]
  },

  'Cossack Squat': {
    url: 'https://www.youtube.com/watch?v=tpczTeSkHz0',
    instructions: [
      'Stand with wide stance',
      'Shift weight to one side, bend that knee',
      'Keep other leg straight, foot flat',
      'Descend until comfortable depth',
      'Push back to center and repeat other side'
    ],
    coaching_cues: [
      'Keep heel down on working leg',
      'Straight leg stays active',
      'Upright torso',
      'Work on mobility gradually'
    ]
  },

  // MOBILITY & WARM-UP
  '9090 Seated Shin Box': {
    url: 'https://www.youtube.com/watch?v=L5JfC3lwOEY',
    start_time: '0:30',
    instructions: [
      'Sit with both knees at 90 degrees',
      'Front leg shin parallel to shoulders',
      'Back leg shin perpendicular',
      'Sit tall, hands behind for support',
      'Hold position, breathe deeply'
    ],
    coaching_cues: [
      'Both hips on ground',
      'Upright posture',
      'Relax into stretch',
      'Feel stretch in hip'
    ]
  },

  'Windmill': {
    url: 'https://www.youtube.com/watch?v=TuZIBxqwPJM',
    instructions: [
      'Stand with weight overhead in one hand',
      'Turn feet 45 degrees away from weight',
      'Hinge at hip, sliding down leg',
      'Keep eyes on overhead weight',
      'Touch ground with free hand if able',
      'Return to start position'
    ],
    coaching_cues: [
      'Keep overhead arm locked out',
      'Don\'t rush the movement',
      'Active shoulder throughout',
      'Hinge at hip, not spine'
    ]
  },

  // OLYMPIC LIFTS
  'Hang Clean': {
    url: 'https://www.youtube.com/watch?v=kUBQ9RQPTvY',
    instructions: [
      'Start with bar at mid-thigh, hook grip',
      'Hinge slightly, weight on mid-foot',
      'Explosively extend hips and shrug',
      'Pull yourself under the bar',
      'Catch in front rack, elbows high'
    ],
    coaching_cues: [
      'Explosive hip extension',
      'Fast elbows under bar',
      'Receive in athletic position',
      'Stand to complete'
    ]
  },

  'Push Press': {
    url: 'https://www.youtube.com/watch?v=iaBVSJm78ko',
    instructions: [
      'Bar in front rack position',
      'Dip knees slightly, chest up',
      'Drive explosively through legs',
      'Press bar overhead as hips extend',
      'Lock out arms overhead'
    ],
    coaching_cues: [
      'Vertical torso in dip',
      'Powerful leg drive',
      'Press as you stand',
      'Full lockout at top'
    ]
  },

  // PLYOMETRICS
  'Box Jump': {
    url: 'https://www.youtube.com/watch?v=NBY9-kTuHEk',
    instructions: [
      'Stand facing box at appropriate height',
      'Quarter squat with arm swing back',
      'Explode up swinging arms forward',
      'Land softly on box in athletic position',
      'Step down carefully'
    ],
    coaching_cues: [
      'Soft landing - absorb force',
      'Full hip extension on jump',
      'Athletic position on landing',
      'Quality over quantity'
    ]
  },

  'Med Ball Slam': {
    url: 'https://www.youtube.com/watch?v=1NwZ72ZJZdg',
    instructions: [
      'Hold medicine ball overhead',
      'Rise onto toes',
      'Throw ball down forcefully',
      'Follow through with hips',
      'Catch on bounce or retrieve'
    ],
    coaching_cues: [
      'Full body explosion',
      'Violent hip flexion',
      'Throw through the floor',
      'Reset between reps'
    ]
  },

  'Med Ball Chest Pass': {
    url: 'https://www.youtube.com/watch?v=M7j7Gyk_wL8',
    instructions: [
      'Hold ball at chest level',
      'Step forward as you push ball',
      'Extend arms fully',
      'Follow through toward target',
      'Catch and reset'
    ],
    coaching_cues: [
      'Explosive push',
      'Use legs and hips',
      'Full arm extension',
      'Quick reset'
    ]
  },

  // CORE & STABILITY
  'Pallof Press': {
    url: 'https://www.youtube.com/watch?v=AH_QZLm_0-s',
    instructions: [
      'Stand perpendicular to cable at chest height',
      'Hold handle at chest with both hands',
      'Press arms straight out',
      'Resist rotation from cable tension',
      'Return to chest and repeat'
    ],
    coaching_cues: [
      'Fight the rotation',
      'Stable hips and spine',
      'Slow and controlled',
      'Breathe throughout'
    ]
  },

  'Copenhagen Plank': {
    url: 'https://www.youtube.com/watch?v=1Kv68zV3TIk',
    start_time: '0:45',
    instructions: [
      'Lie on side, top leg on elevated surface',
      'Bottom leg under bench/surface',
      'Prop up on elbow',
      'Lift hips, creating straight line',
      'Hold position'
    ],
    coaching_cues: [
      'Straight body alignment',
      'Don\'t let hips sag',
      'Squeeze adductors',
      'Breathe normally'
    ]
  },

  'Dead Bug': {
    url: 'https://www.youtube.com/watch?v=g_BYB0R-4Ws',
    instructions: [
      'Lie on back, arms extended toward ceiling',
      'Knees bent 90 degrees',
      'Press low back into floor',
      'Extend opposite arm and leg',
      'Return and repeat other side'
    ],
    coaching_cues: [
      'Maintain low back contact',
      'Slow and controlled',
      'Exhale as you extend',
      'Quality movement'
    ]
  },

  // UPPER BACK
  'Face Pull': {
    url: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    instructions: [
      'Set cable at upper chest height',
      'Grasp rope with thumbs back',
      'Pull toward face, externally rotate',
      'Elbows high, squeeze shoulder blades',
      'Slowly return to start'
    ],
    coaching_cues: [
      'Pull rope apart at face',
      'High elbows',
      'External rotation at finish',
      'Control the return'
    ]
  },

  'Banded Pull Apart': {
    url: 'https://www.youtube.com/watch?v=ip1EWUllRx8',
    instructions: [
      'Hold band at chest level, arms extended',
      'Pull band apart, squeezing shoulder blades',
      'Keep arms straight throughout',
      'Return with control'
    ],
    coaching_cues: [
      'Retract shoulder blades',
      'Straight arms',
      'Chest up',
      'Controlled tempo'
    ]
  },

  // ROTATIONAL POWER
  'Half Kneeling Cable Chop': {
    url: 'https://www.youtube.com/watch?v=jXjdh0G8qZw',
    instructions: [
      'Kneel with inside leg down',
      'Cable at high position',
      'Pull cable down and across body',
      'Rotate through core',
      'Control return to start'
    ],
    coaching_cues: [
      'Core-driven movement',
      'Tall spine',
      'Control the rotation',
      'Don\'t use all arms'
    ]
  },

  'Landmine Rotation': {
    url: 'https://www.youtube.com/watch?v=yK5xrJk8U7s',
    instructions: [
      'Hold end of landmine barbell',
      'Feet shoulder-width, athletic stance',
      'Rotate barbell from side to side',
      'Pivot on back foot as you rotate',
      'Control throughout'
    ],
    coaching_cues: [
      'Rotate through core and hips',
      'Keep arms extended',
      'Athletic position',
      'Powerful rotation'
    ]
  },

  // CARRIES
  'Farmers Carry': {
    url: 'https://www.youtube.com/watch?v=WiY_zb1p6o4',
    instructions: [
      'Pick up heavy weight in each hand',
      'Stand tall with good posture',
      'Walk forward with controlled steps',
      'Keep shoulders back and down',
      'Set weights down safely'
    ],
    coaching_cues: [
      'Tall spine, shoulders packed',
      'Controlled breathing',
      'Even weight distribution',
      'Don\'t lean to either side'
    ]
  },

  'Suitcase Carry': {
    url: 'https://www.youtube.com/watch?v=jCjRlPXpbGw',
    instructions: [
      'Hold single weight in one hand',
      'Stand tall, engage core',
      'Walk forward without leaning',
      'Resist lateral flexion',
      'Switch sides'
    ],
    coaching_cues: [
      'Fight the lean',
      'Shoulders level',
      'Core braced',
      'Tall posture'
    ]
  },

  // THROWING ARM CARE
  'Bottoms Up KB Press': {
    url: 'https://www.youtube.com/watch?v=m1wpVkXw8Ew',
    instructions: [
      'Hold kettlebell upside down at shoulder',
      'Engage grip and shoulder to stabilize',
      'Press overhead maintaining bottoms up',
      'Control descent back to shoulder'
    ],
    coaching_cues: [
      'Tight grip prevents tip',
      'Active shoulder stability',
      'Vertical press path',
      'Start light - technique first'
    ]
  },

  'YWT Raise': {
    url: 'https://www.youtube.com/watch?v=7Rq0SB1rZhw',
    instructions: [
      'Lie prone on incline bench',
      'Hold light dumbbells',
      'Raise arms in Y position, then W, then T',
      'Squeeze shoulder blades',
      'Lower with control'
    ],
    coaching_cues: [
      'Light weight, high reps',
      'Squeeze at top',
      'Slow and controlled',
      'Full scapular retraction'
    ]
  },

  // ARMS
  'Barbell Curl': {
    url: 'https://www.youtube.com/watch?v=kwG2ipFRgfo',
    instructions: [
      'Grip bar shoulder-width, supinated',
      'Elbows at sides',
      'Curl bar up keeping elbows stationary',
      'Squeeze at top',
      'Lower under control'
    ],
    coaching_cues: [
      'No body English',
      'Elbows stay in place',
      'Full range of motion',
      'Control the negative'
    ]
  },

  'Tricep Pushdown': {
    url: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    instructions: [
      'Grasp cable attachment overhead',
      'Elbows tucked at sides',
      'Extend arms fully',
      'Squeeze triceps at bottom',
      'Control return to top'
    ],
    coaching_cues: [
      'Elbows stay tucked',
      'Full extension',
      'Control the weight',
      'Don\'t use momentum'
    ]
  }
}

/**
 * Validates YouTube URL format
 */
function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
  ]
  return patterns.some(pattern => pattern.test(url))
}

/**
 * Finds exercise card by name using exact and fuzzy matching
 */
function findExerciseCard(name: string, cards: ExerciseCard[]): ExerciseCard | null {
  // Exact match first
  let match = cards.find(c => c.name.toLowerCase() === name.toLowerCase())
  if (match) return match

  // Partial match - name contains or is contained by search
  match = cards.find(c =>
    c.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(c.name.toLowerCase())
  )
  if (match) return match

  // Try short name
  match = cards.find(c =>
    c.short_name?.toLowerCase() === name.toLowerCase()
  )
  if (match) return match

  // Try without common suffixes/prefixes
  const cleanedName = name.replace(/\(.*?\)/g, '').trim()
  match = cards.find(c =>
    c.name.toLowerCase().includes(cleanedName.toLowerCase()) ||
    cleanedName.toLowerCase().includes(c.name.toLowerCase())
  )

  return match || null
}

/**
 * Updates exercise card with video and instructional data
 */
async function updateExerciseCardVideo(
  cardId: string,
  videoData: VideoData
): Promise<void> {
  const { error } = await supabase
    .from('exercise_cards')
    .update({
      video_url: videoData.url,
      video_start_time: videoData.start_time || null,
      video_end_time: videoData.end_time || null,
      instructions: videoData.instructions || null,
      coaching_cues: videoData.coaching_cues || null
    })
    .eq('id', cardId)

  if (error) throw error
}

/**
 * Main import function
 */
async function main() {
  console.log('🎥 Starting Exercise Video Import...\n')
  console.log('=' .repeat(60))

  // Validate environment
  if (!process.env.VITE_SUPABASE_URL) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable')
  }

  // 1. Fetch all exercise cards
  console.log('\n📋 Fetching exercise cards from database...')
  const { data: exerciseCards, error: fetchError } = await supabase
    .from('exercise_cards')
    .select('*')

  if (fetchError) {
    throw new Error(`Failed to fetch exercise cards: ${fetchError.message}`)
  }

  if (!exerciseCards || exerciseCards.length === 0) {
    throw new Error('No exercise cards found in database')
  }

  console.log(`✅ Found ${exerciseCards.length} exercise cards\n`)

  // Validate video URLs
  console.log('🔍 Validating YouTube URLs...')
  let invalidUrls = 0
  for (const [name, data] of Object.entries(exerciseVideoMappings)) {
    if (!validateYouTubeUrl(data.url)) {
      console.log(`  ⚠️  Invalid URL for ${name}: ${data.url}`)
      invalidUrls++
    }
  }
  if (invalidUrls === 0) {
    console.log('✅ All URLs valid\n')
  } else {
    console.log(`⚠️  ${invalidUrls} invalid URLs found\n`)
  }

  // 2. Process each mapping
  console.log('📝 Processing video mappings...\n')

  let successCount = 0
  let failCount = 0
  const failures: Array<{ name: string; reason: string }> = []
  const matches: Array<{ search: string; found: string }> = []

  for (const [exerciseName, videoData] of Object.entries(exerciseVideoMappings)) {
    try {
      const card = findExerciseCard(exerciseName, exerciseCards as ExerciseCard[])

      if (!card) {
        const reason = 'No matching exercise card found'
        console.log(`❌ ${exerciseName}: ${reason}`)
        failures.push({ name: exerciseName, reason })
        failCount++
        continue
      }

      // Check if it's a fuzzy match
      if (card.name !== exerciseName) {
        matches.push({ search: exerciseName, found: card.name })
      }

      await updateExerciseCardVideo(card.id, videoData)

      const hasInstructions = videoData.instructions ? ` (+${videoData.instructions.length} instructions)` : ''
      const hasCues = videoData.coaching_cues ? ` (+${videoData.coaching_cues.length} cues)` : ''

      console.log(`✅ ${exerciseName} → ${card.name}${hasInstructions}${hasCues}`)
      successCount++

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ ${exerciseName}: ${errorMsg}`)
      failures.push({ name: exerciseName, reason: errorMsg })
      failCount++
    }
  }

  // 3. Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Import Summary')
  console.log('='.repeat(60))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📝 Total exercises in database: ${exerciseCards.length}`)
  console.log(`🎯 Attempted to update: ${Object.keys(exerciseVideoMappings).length}`)

  if (matches.length > 0) {
    console.log('\n🔄 Fuzzy Matches (mapping → database):')
    matches.forEach(({ search, found }) => {
      console.log(`  "${search}" → "${found}"`)
    })
  }

  if (failures.length > 0) {
    console.log('\n❌ Failed Exercises:')
    failures.forEach(({ name, reason }) => {
      console.log(`  - ${name}: ${reason}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  if (failCount === 0) {
    console.log('🎉 All video imports completed successfully!')
  } else {
    console.log(`⚠️  Completed with ${failCount} failures`)
  }

  console.log('='.repeat(60))
}

// Run the script
main()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message)
    process.exit(1)
  })
