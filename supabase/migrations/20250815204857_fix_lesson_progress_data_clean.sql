-- Migration: Fix inconsistent lesson progress data
-- Date: 2025-08-15
-- Description: Fixes inconsistent data and recalculates course progress

-- 1. Fix records with 100% progress but no completed_at
UPDATE lesson_progress 
SET completed_at = created_at
WHERE progress_percentage >= 100 AND completed_at IS NULL;

-- 2. Fix records with 0% but with completed_at (inconsistency)
UPDATE lesson_progress 
SET completed_at = NULL
WHERE progress_percentage = 0 AND completed_at IS NOT NULL;

-- 3. Fix records with progress between 1-99% but with completed_at
UPDATE lesson_progress 
SET completed_at = NULL
WHERE progress_percentage > 0 AND progress_percentage < 100 AND completed_at IS NOT NULL;

-- 4. Recalculate overall course progress based on completed lessons
UPDATE enrollments 
SET progress = COALESCE((
  SELECT ROUND(
    (COUNT(CASE WHEN lp.progress_percentage >= 100 OR lp.completed_at IS NOT NULL THEN 1 END) * 100.0) / 
    NULLIF(COUNT(l.id), 0)
  )
  FROM lessons l
  LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = enrollments.id
  WHERE l.course_id = enrollments.course_id
), 0)
WHERE EXISTS (
  SELECT 1 FROM courses c WHERE c.id = enrollments.course_id
);

-- 5. Create indexes for better performance (if they do not exist)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_lesson ON lesson_progress(enrollment_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON enrollments(progress) WHERE progress > 0;
