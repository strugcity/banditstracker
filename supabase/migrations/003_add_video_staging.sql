-- ============================================================================
-- Migration: Add Video Analysis Staging Table
-- ============================================================================
-- This migration adds a staging area for video analysis results.
-- Users can review AI-extracted exercises before importing to the library.
--
-- WORKFLOW:
-- 1. analyze-video function saves results to video_analysis_sessions
-- 2. User reviews exercises in UI
-- 3. User selects exercises to import
-- 4. import-to-library function creates exercise_cards from selected exercises
-- ============================================================================

-- ============================================================================
-- TABLE: video_analysis_sessions
-- ============================================================================
-- Staging area for video analysis results before importing to exercise library
-- Allows user review, editing, and selective import
CREATE TABLE IF NOT EXISTS video_analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Video metadata
    video_url TEXT NOT NULL,
    video_title TEXT,
    sport VARCHAR(100),
    total_duration VARCHAR(10),

    -- Full AI analysis result stored as JSONB
    -- Structure: { exercises: [...], video_title, sport, total_duration }
    analysis_result JSONB NOT NULL,

    -- Session status tracking
    status VARCHAR(20) DEFAULT 'pending',
    -- pending: awaiting user review
    -- imported: exercises imported to library
    -- rejected: user decided not to import
    -- error: analysis failed

    -- Import tracking
    imported_at TIMESTAMPTZ,
    imported_exercise_ids JSONB,  -- Array of exercise_card UUIDs that were created

    -- Future: track who created this session
    created_by UUID,  -- Will reference users table in multi-user version

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_status
    ON video_analysis_sessions(status);

CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_created_at
    ON video_analysis_sessions(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_video_analysis_sessions_updated_at
    BEFORE UPDATE ON video_analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table comments
COMMENT ON TABLE video_analysis_sessions IS 'Staging area for video analysis before importing to exercise library';
COMMENT ON COLUMN video_analysis_sessions.video_url IS 'YouTube or video URL that was analyzed';
COMMENT ON COLUMN video_analysis_sessions.analysis_result IS 'Full Gemini AI response stored as JSONB';
COMMENT ON COLUMN video_analysis_sessions.status IS 'pending, imported, rejected, or error';
COMMENT ON COLUMN video_analysis_sessions.imported_exercise_ids IS 'Array of exercise_card IDs created from this session';
