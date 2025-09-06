-- Migration: Add is_active column to courses and lessons
-- Date: 2025-01-17
-- Description: Implements non-destructive activation/deactivation for courses and lessons

-- Add is_active column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON lessons(is_active);

-- Update RLS policies for courses to include is_active check
DROP POLICY IF EXISTS "Public can view published courses with pricing" ON courses;
CREATE POLICY "Public can view published and active courses" ON courses
  FOR SELECT
  USING (status = 'published' AND is_active = true);

-- Update RLS policy for lessons to include is_active check
DROP POLICY IF EXISTS "Students can view lessons of enrolled courses" ON lessons;
CREATE POLICY "Students can view active lessons of enrolled courses" ON lessons
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.course_id = lessons.course_id 
      AND enrollments.student_id = auth.uid()
    )
  );

-- Create or update policy for teachers to see all lessons of their courses
CREATE POLICY IF NOT EXISTS "Teachers can view all lessons of their courses" ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id 
      AND courses.teacher_id = auth.uid()
    )
  );

-- Create or update policy for admins to see all lessons
CREATE POLICY IF NOT EXISTS "Admins can view all lessons" ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to deactivate/activate course and its lessons
CREATE OR REPLACE FUNCTION toggle_course_activation(
  course_id UUID,
  is_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Update course status
  UPDATE courses 
  SET is_active = toggle_course_activation.is_active 
  WHERE id = course_id;
  
  -- Update all lessons of the course
  UPDATE lessons 
  SET is_active = toggle_course_activation.is_active 
  WHERE course_id = toggle_course_activation.course_id;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle individual lesson activation
CREATE OR REPLACE FUNCTION toggle_lesson_activation(
  lesson_id UUID,
  is_active BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Update lesson status
  UPDATE lessons 
  SET is_active = toggle_lesson_activation.is_active 
  WHERE id = lesson_id;
END;
$$ LANGUAGE plpgsql;

-- Create audit log for activation/deactivation actions
CREATE TABLE IF NOT EXISTS activation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'lesson')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('activate', 'deactivate')),
  previous_state BOOLEAN,
  new_state BOOLEAN,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for audit log
ALTER TABLE activation_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage audit log
CREATE POLICY "Only admins can manage activation audit log" ON activation_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to log activation changes
CREATE OR REPLACE FUNCTION log_activation_change(
  p_admin_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_previous_state BOOLEAN,
  p_new_state BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activation_audit_log (
    admin_id, entity_type, entity_id, action, 
    previous_state, new_state, reason
  ) VALUES (
    p_admin_id, p_entity_type, p_entity_id, p_action,
    p_previous_state, p_new_state, p_reason
  );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_admin_id ON activation_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_entity ON activation_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activation_audit_log_created_at ON activation_audit_log(created_at);

-- Comments for documentation
COMMENT ON COLUMN courses.is_active IS 'Non-destructive activation flag for courses';
COMMENT ON COLUMN lessons.is_active IS 'Non-destructive activation flag for lessons';
COMMENT ON FUNCTION toggle_course_activation(UUID, BOOLEAN) IS 'Toggles course and all its lessons activation status';
COMMENT ON FUNCTION toggle_lesson_activation(UUID, BOOLEAN) IS 'Toggles individual lesson activation status';
COMMENT ON TABLE activation_audit_log IS 'Audit trail for course and lesson activation/deactivation actions';