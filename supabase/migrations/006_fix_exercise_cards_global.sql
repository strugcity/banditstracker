-- ============================================================================
-- Migration: 006_fix_exercise_cards_global.sql
-- Description: Ensure all exercise cards are marked as global for accessibility
-- ============================================================================

-- Mark all existing exercise cards as global
UPDATE exercise_cards
SET is_global = TRUE
WHERE is_global IS NULL OR is_global = FALSE;

-- Optional: If you need to temporarily disable RLS for testing (NOT for production)
-- ALTER TABLE exercise_cards DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_exercises DISABLE ROW LEVEL SECURITY;
