-- Migration: Add SIE integration columns to courses table
-- Date: 2025-01-19
-- Description: Add columns for SIE course integration

-- Add SIE-specific columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_sie_course BOOLEAN DEFAULT false;

-- Check if sie_course_id exists and what type it is
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'sie_course_id') THEN
        -- Column doesn't exist, create as TEXT
        ALTER TABLE courses ADD COLUMN sie_course_id TEXT;
    ELSE
        -- Column exists, check if it's INTEGER and convert to TEXT if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'sie_course_id' 
                   AND data_type = 'integer') THEN
            -- Convert INTEGER column to TEXT
            ALTER TABLE courses ALTER COLUMN sie_course_id TYPE TEXT USING sie_course_id::TEXT;
        END IF;
    END IF;
END $$;

-- Create index for SIE course queries
CREATE INDEX IF NOT EXISTS idx_courses_is_sie_course ON courses(is_sie_course);
CREATE INDEX IF NOT EXISTS idx_courses_sie_course_id ON courses(sie_course_id);

-- Create unique constraint to prevent duplicate SIE course imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_sie_course_id_unique 
ON courses(sie_course_id) 
WHERE sie_course_id IS NOT NULL;

-- Update existing SIE courses if any exist (based on video_url pattern)
UPDATE courses 
SET is_sie_course = true, 
    sie_course_id = SUBSTRING(video_url FROM 'https://www\.sie\.com\.br/course/(.+)$')
WHERE video_url LIKE 'https://www.sie.com.br/course/%' 
AND (is_sie_course IS NULL OR is_sie_course = false);