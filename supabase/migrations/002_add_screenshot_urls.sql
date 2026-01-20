-- ============================================================================
-- Migration: Add screenshot_urls column to exercise_cards
-- ============================================================================
-- This migration adds support for storing actual image URLs from extracted
-- video frames, complementing the screenshot_timestamps field.
-- ============================================================================

-- Add screenshot_urls column to store image URLs
ALTER TABLE exercise_cards
ADD COLUMN IF NOT EXISTS screenshot_urls JSONB;

COMMENT ON COLUMN exercise_cards.screenshot_urls IS
  'Array of image URLs for extracted video frames: ["https://...", "https://..."]';

-- Create storage bucket for exercise screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-screenshots', 'exercise-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-screenshots');

CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-screenshots'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Service role can manage screenshots"
ON storage.objects FOR ALL
USING (bucket_id = 'exercise-screenshots' AND auth.role() = 'service_role');

-- ============================================================================
-- Migration Complete
-- ============================================================================
