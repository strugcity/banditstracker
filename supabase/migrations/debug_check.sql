-- Run this in Supabase SQL Editor to see what exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check the structure of the workouts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workouts'
ORDER BY ordinal_position;
