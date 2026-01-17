/**
 * Database Seeding Script
 *
 * Populates the database with sample exercises and workout data
 * for development and testing purposes.
 *
 * Usage:
 *   npx tsx scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample exercises to seed
const exercises = [
  {
    name: 'Barbell Bench Press',
    description: 'Classic chest exercise performed lying on a flat bench',
    category: 'push',
    equipment: ['barbell', 'bench'],
  },
  {
    name: 'Barbell Squat',
    description: 'Fundamental lower body exercise',
    category: 'legs',
    equipment: ['barbell', 'squat rack'],
  },
  {
    name: 'Deadlift',
    description: 'Full body compound movement',
    category: 'pull',
    equipment: ['barbell'],
  },
  {
    name: 'Pull-ups',
    description: 'Bodyweight back exercise',
    category: 'pull',
    equipment: ['pull-up bar'],
  },
  {
    name: 'Overhead Press',
    description: 'Shoulder press standing or seated',
    category: 'push',
    equipment: ['barbell'],
  },
  {
    name: 'Barbell Row',
    description: 'Bent over row for back development',
    category: 'pull',
    equipment: ['barbell'],
  },
  {
    name: 'Dumbbell Bench Press',
    description: 'Chest exercise with dumbbells',
    category: 'push',
    equipment: ['dumbbells', 'bench'],
  },
  {
    name: 'Romanian Deadlift',
    description: 'Hamstring and glute focused variation',
    category: 'legs',
    equipment: ['barbell'],
  },
  {
    name: 'Plank',
    description: 'Core stability exercise',
    category: 'core',
    equipment: [],
  },
  {
    name: 'Dips',
    description: 'Bodyweight tricep and chest exercise',
    category: 'push',
    equipment: ['dip bars'],
  },
]

async function seedExercises() {
  console.log('Seeding exercises...')

  const { data, error } = await supabase
    .from('exercises')
    .insert(exercises)
    .select()

  if (error) {
    console.error('Error seeding exercises:', error)
    return null
  }

  console.log(`✓ Seeded ${data.length} exercises`)
  return data
}

async function main() {
  console.log('Starting database seeding...\n')

  // Seed exercises
  await seedExercises()

  console.log('\n✓ Database seeding complete!')
}

// Run the seed script
main().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
