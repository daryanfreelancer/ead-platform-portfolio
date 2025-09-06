import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function updateCourseProgress(supabase, enrollmentId, courseId) {
  try {
    // Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    if (lessonsError || !lessons?.length) {
      return
    }

    // Get lesson progress for this enrollment
    const { data: progressData, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id, progress_percentage, completed_at')
      .eq('enrollment_id', enrollmentId)

    if (progressError) {
      return
    }

    // Calculate overall progress
    const totalLessons = lessons.length
    const completedLessons = progressData?.filter(p => p.completed_at || p.progress_percentage >= 100).length || 0
    const overallProgress = Math.round((completedLessons / totalLessons) * 100)

    // Determine if course is completed
    const isCompleted = overallProgress >= 100
    const completedAt = isCompleted && completedLessons === totalLessons ? new Date().toISOString() : null

    // Update enrollment progress
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        progress: overallProgress,
        completed_at: completedAt
      })
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('Error updating course progress:', updateError)
    }
  } catch (error) {
    console.error('Error in updateCourseProgress:', error)
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { lesson_id, progress_percentage, watch_time_seconds, reading_progress_percentage, last_read_position } = body

    // Validate required fields
    if (!lesson_id || progress_percentage === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate lesson_id format
    if (typeof lesson_id !== 'string' || lesson_id.length === 0) {
      console.error('Invalid lesson_id format:', lesson_id)
      return NextResponse.json({ error: 'Invalid lesson_id format' }, { status: 400 })
    }

    // Get lesson and verify enrollment
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lesson_id)
      .single()

    if (lessonError) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if user is enrolled in this course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', lesson.course_id)
      .single()

    if (enrollmentError) {
      return NextResponse.json({ error: 'User not enrolled in this course' }, { status: 403 })
    }

    // Update or create lesson progress
    const progressData = {
      enrollment_id: enrollment.id,
      lesson_id,
      progress_percentage: Math.min(100, Math.max(0, progress_percentage)),
      watch_time_seconds: watch_time_seconds || 0
    }

    // Add reading-specific fields if provided
    if (reading_progress_percentage !== undefined) {
      progressData.reading_progress_percentage = Math.min(100, Math.max(0, reading_progress_percentage))
      // Use reading progress for completion if available
      progressData.completed_at = reading_progress_percentage >= 100 ? new Date().toISOString() : null
    } else {
      // Use regular progress for completion
      progressData.completed_at = progress_percentage >= 100 ? new Date().toISOString() : null
    }

    if (last_read_position !== undefined) {
      progressData.last_read_position = last_read_position
    }

    const { data: lessonProgress, error } = await supabase
      .from('lesson_progress')
      .upsert(progressData, { 
        onConflict: 'enrollment_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Upsert error:', error)
      return NextResponse.json({ 
        error: error.message
      }, { status: 500 })
    }

    // Recalculate course progress after lesson progress update
    await updateCourseProgress(supabase, enrollment.id, lesson.course_id)

    return NextResponse.json(lessonProgress)
  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const lessonId = searchParams.get('lesson_id')
    
    if (!courseId && !lessonId) {
      return NextResponse.json({ error: 'Course ID or Lesson ID is required' }, { status: 400 })
    }

    if (courseId) {
      // Get enrollment for the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (enrollmentError || !enrollment) {
        return NextResponse.json({ error: 'User not enrolled in this course' }, { status: 403 })
      }

      // Get lesson progress for this enrollment
      const { data: progress, error } = await supabase
        .from('lesson_progress')
        .select(`
          *,
          lessons (
            id,
            title,
            course_id,
            order_index
          )
        `)
        .eq('enrollment_id', enrollment.id)

      if (error) {
        console.error('Error fetching lesson progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(progress || [])
    }

    if (lessonId) {
      // Get lesson to find course
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .single()

      if (lessonError || !lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }

      // Get enrollment for the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', lesson.course_id)
        .single()

      if (enrollmentError || !enrollment) {
        return NextResponse.json({ error: 'User not enrolled in this course' }, { status: 403 })
      }

      // Get specific lesson progress
      const { data: progress, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('lesson_id', lessonId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching lesson progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(progress || {})
    }

    return NextResponse.json({ error: 'Course ID or Lesson ID is required' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching lesson progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}