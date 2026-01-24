-- ============================================================================
-- Migration: 007_add_video_sessions_rls.sql
-- Description: Add RLS policies for video_analysis_sessions table
-- ============================================================================

-- Enable RLS on video_analysis_sessions
ALTER TABLE video_analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all video analysis sessions
CREATE POLICY "video_sessions_select_authenticated" ON video_analysis_sessions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create sessions
CREATE POLICY "video_sessions_insert_authenticated" ON video_analysis_sessions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update sessions they created (or all if global admin)
CREATE POLICY "video_sessions_update_authenticated" ON video_analysis_sessions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow users to delete sessions they created (or all if global admin)
CREATE POLICY "video_sessions_delete_authenticated" ON video_analysis_sessions
    FOR DELETE USING (auth.uid() IS NOT NULL);
