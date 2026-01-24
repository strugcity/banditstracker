-- ============================================================================
-- Migration: 010_staging_modal_system.sql
-- Description: Add inline staging modal system with session limits, auto-expiry,
--              and exercise "New" flag functionality
-- ============================================================================

-- ============================================================================
-- PART 1: Modify video_analysis_sessions table
-- ============================================================================

-- Add owner tracking
ALTER TABLE video_analysis_sessions
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add edited exercises storage (user modifications before final save)
ALTER TABLE video_analysis_sessions
  ADD COLUMN IF NOT EXISTS edited_exercises JSONB DEFAULT '{}';

-- Add session expiry (24 hours from creation)
ALTER TABLE video_analysis_sessions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add completion tracking
ALTER TABLE video_analysis_sessions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add auto-import flag (true when exercises were auto-imported on expiry)
ALTER TABLE video_analysis_sessions
  ADD COLUMN IF NOT EXISTS auto_imported BOOLEAN DEFAULT FALSE;

-- Comments for documentation
COMMENT ON COLUMN video_analysis_sessions.owner_id IS 'User who created the staging session';
COMMENT ON COLUMN video_analysis_sessions.edited_exercises IS 'JSONB storing user edits by exercise index before final save';
COMMENT ON COLUMN video_analysis_sessions.expires_at IS 'Session auto-expires and imports exercises after this time (24h from creation)';
COMMENT ON COLUMN video_analysis_sessions.completed_at IS 'Timestamp when user completed or discarded the session';
COMMENT ON COLUMN video_analysis_sessions.auto_imported IS 'True if exercises were auto-imported due to session expiry';

-- ============================================================================
-- PART 2: Modify exercise_cards table
-- ============================================================================

-- Add "New" flag for UI badge
ALTER TABLE exercise_cards
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;

-- Add source session tracking
ALTER TABLE exercise_cards
  ADD COLUMN IF NOT EXISTS source_session_id UUID REFERENCES video_analysis_sessions(id);

-- Add expiry for auto-clearing "New" flag (7 days after import)
ALTER TABLE exercise_cards
  ADD COLUMN IF NOT EXISTS new_expires_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN exercise_cards.is_new IS 'Flag to show "New" badge in exercise library UI';
COMMENT ON COLUMN exercise_cards.source_session_id IS 'Video analysis session this exercise was imported from';
COMMENT ON COLUMN exercise_cards.new_expires_at IS 'Auto-clear is_new flag after this date (7 days from import)';

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

-- Index for finding open sessions by user (for session limit check)
CREATE INDEX IF NOT EXISTS idx_video_sessions_owner_open
  ON video_analysis_sessions(owner_id, expires_at)
  WHERE status IN ('pending', 'in_progress');

-- Index for finding expired sessions (for auto-import job)
CREATE INDEX IF NOT EXISTS idx_video_sessions_expired
  ON video_analysis_sessions(expires_at)
  WHERE status IN ('pending', 'in_progress') AND auto_imported = FALSE;

-- Index for finding exercises with "New" flag (for display and cleanup)
CREATE INDEX IF NOT EXISTS idx_exercise_cards_is_new
  ON exercise_cards(is_new, new_expires_at)
  WHERE is_new = TRUE;

-- Index for finding exercises by source session
CREATE INDEX IF NOT EXISTS idx_exercise_cards_source_session
  ON exercise_cards(source_session_id)
  WHERE source_session_id IS NOT NULL;

-- ============================================================================
-- PART 4: Session limit enforcement trigger
-- ============================================================================

-- Function to check session limit (max 3 open sessions per user)
CREATE OR REPLACE FUNCTION check_staging_session_limit()
RETURNS TRIGGER AS $$
DECLARE
  open_count INTEGER;
BEGIN
  -- Only check if owner_id is provided
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count open sessions for this user
  SELECT COUNT(*) INTO open_count
  FROM video_analysis_sessions
  WHERE owner_id = NEW.owner_id
    AND status IN ('pending', 'in_progress')
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Enforce limit of 3
  IF open_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 open staging sessions allowed. Please complete or discard existing sessions.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to allow re-running migration)
DROP TRIGGER IF EXISTS enforce_staging_session_limit ON video_analysis_sessions;
CREATE TRIGGER enforce_staging_session_limit
  BEFORE INSERT ON video_analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_staging_session_limit();

-- ============================================================================
-- PART 5: Update RLS policies for session ownership
-- ============================================================================

-- Drop existing policies that we'll replace
DROP POLICY IF EXISTS "video_sessions_select_authenticated" ON video_analysis_sessions;
DROP POLICY IF EXISTS "video_sessions_insert_authenticated" ON video_analysis_sessions;
DROP POLICY IF EXISTS "video_sessions_update_authenticated" ON video_analysis_sessions;
DROP POLICY IF EXISTS "video_sessions_delete_authenticated" ON video_analysis_sessions;

-- Users can view their own sessions (or all if they're authenticated for backward compat)
CREATE POLICY "video_sessions_select_own_or_auth" ON video_analysis_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      owner_id IS NULL OR  -- Legacy sessions without owner
      owner_id = auth.uid()  -- User's own sessions
    )
  );

-- Users can only insert sessions they own
CREATE POLICY "video_sessions_insert_own" ON video_analysis_sessions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      owner_id IS NULL OR owner_id = auth.uid()
    )
  );

-- Users can only update their own sessions
CREATE POLICY "video_sessions_update_own" ON video_analysis_sessions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      owner_id IS NULL OR owner_id = auth.uid()
    )
  );

-- Users can only delete their own sessions
CREATE POLICY "video_sessions_delete_own" ON video_analysis_sessions
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      owner_id IS NULL OR owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 6: Backfill existing data
-- ============================================================================

-- Set expires_at for existing pending sessions (24 hours from now)
UPDATE video_analysis_sessions
SET expires_at = NOW() + INTERVAL '24 hours'
WHERE status = 'pending' AND expires_at IS NULL;

-- Set owner_id from created_by if available
UPDATE video_analysis_sessions
SET owner_id = created_by
WHERE owner_id IS NULL AND created_by IS NOT NULL;

-- ============================================================================
-- PART 7: Helper function for auto-import (called by scheduled function)
-- ============================================================================

-- Function to auto-import exercises from a single expired session
CREATE OR REPLACE FUNCTION auto_import_session_exercises(session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  session_record RECORD;
  exercise JSONB;
  exercise_index INTEGER := 0;
  imported_count INTEGER := 0;
  new_exercise_id UUID;
  edited_data JSONB;
BEGIN
  -- Get the session
  SELECT * INTO session_record
  FROM video_analysis_sessions
  WHERE id = session_id
    AND status IN ('pending', 'in_progress')
    AND auto_imported = FALSE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Import each exercise
  FOR exercise IN SELECT * FROM jsonb_array_elements(session_record.analysis_result->'exercises')
  LOOP
    -- Check for user edits
    edited_data := session_record.edited_exercises->exercise_index::text;

    -- Insert into exercise_cards
    INSERT INTO exercise_cards (
      name,
      video_url,
      video_start_time,
      video_end_time,
      instructions,
      coaching_cues,
      screenshot_timestamps,
      difficulty,
      equipment,
      is_new,
      new_expires_at,
      source_session_id,
      owner_id
    ) VALUES (
      COALESCE(edited_data->>'name', exercise->>'name'),
      session_record.video_url,
      COALESCE(edited_data->>'start_time', exercise->>'start_time'),
      COALESCE(edited_data->>'end_time', exercise->>'end_time'),
      COALESCE(edited_data->'instructions', exercise->'instructions'),
      COALESCE(edited_data->'coaching_cues', exercise->'coaching_cues'),
      COALESCE(edited_data->'screenshot_timestamps', exercise->'screenshot_timestamps'),
      COALESCE(edited_data->>'difficulty', exercise->>'difficulty'),
      COALESCE(edited_data->'equipment', exercise->'equipment'),
      TRUE,  -- is_new
      NOW() + INTERVAL '7 days',  -- new_expires_at
      session_id,
      session_record.owner_id
    )
    ON CONFLICT (name) DO UPDATE SET
      video_url = EXCLUDED.video_url,
      instructions = EXCLUDED.instructions,
      coaching_cues = EXCLUDED.coaching_cues,
      is_new = TRUE,
      new_expires_at = NOW() + INTERVAL '7 days',
      updated_at = NOW()
    RETURNING id INTO new_exercise_id;

    imported_count := imported_count + 1;
    exercise_index := exercise_index + 1;
  END LOOP;

  -- Mark session as expired and auto-imported
  UPDATE video_analysis_sessions
  SET status = 'expired',
      auto_imported = TRUE,
      completed_at = NOW()
  WHERE id = session_id;

  RETURN imported_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear expired "New" flags
CREATE OR REPLACE FUNCTION clear_expired_new_flags()
RETURNS INTEGER AS $$
DECLARE
  cleared_count INTEGER;
BEGIN
  UPDATE exercise_cards
  SET is_new = FALSE,
      new_expires_at = NULL
  WHERE is_new = TRUE
    AND new_expires_at IS NOT NULL
    AND new_expires_at < NOW();

  GET DIAGNOSTICS cleared_count = ROW_COUNT;
  RETURN cleared_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: Grant permissions for edge functions
-- ============================================================================

-- Allow service role to call helper functions
GRANT EXECUTE ON FUNCTION auto_import_session_exercises(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION clear_expired_new_flags() TO service_role;

-- ============================================================================
-- Migration complete
-- ============================================================================
