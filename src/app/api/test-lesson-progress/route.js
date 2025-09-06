import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    console.log('🧪 TEST: Starting lesson progress test with same payload structure')
    
    const supabase = await createClient()
    console.log('🧪 TEST: Supabase client created')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🧪 TEST: User check:', user ? 'Found' : 'Not found', 'Error:', authError)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        step: 'authentication'
      }, { status: 401 })
    }

    console.log('🧪 TEST: Parsing request body...')
    const body = await request.json()
    console.log('🧪 TEST: Body received:', body)
    
    const { lesson_id, progress_percentage } = body
    
    // Validate required fields
    if (!lesson_id || progress_percentage === undefined) {
      console.log('🧪 TEST: Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields',
        step: 'validation',
        received: { lesson_id, progress_percentage }
      }, { status: 400 })
    }

    // Test lesson lookup
    console.log('🧪 TEST: Looking up lesson...')
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lesson_id)
      .single()

    if (lessonError) {
      console.log('🧪 TEST: Lesson lookup failed:', lessonError)
      return NextResponse.json({ 
        error: 'Lesson not found',
        step: 'lesson_lookup',
        lessonError: lessonError.message
      }, { status: 404 })
    }
    
    console.log('🧪 TEST: Lesson found:', lesson)

    // Test enrollment lookup
    console.log('🧪 TEST: Looking up enrollment...')
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', lesson.course_id)
      .single()

    if (enrollmentError) {
      console.log('🧪 TEST: Enrollment lookup failed:', enrollmentError)
      return NextResponse.json({ 
        error: 'User not enrolled in this course',
        step: 'enrollment_lookup',
        enrollmentError: enrollmentError.message
      }, { status: 403 })
    }
    
    console.log('🧪 TEST: Enrollment found:', enrollment)

    // Test data preparation
    const progressData = {
      enrollment_id: enrollment.id,
      lesson_id,
      progress_percentage: Math.min(100, Math.max(0, progress_percentage)),
      watch_time_seconds: 0,
      completed_at: progress_percentage >= 100 ? new Date().toISOString() : null
    }
    
    console.log('🧪 TEST: Progress data prepared:', progressData)

    // Test upsert operation
    console.log('🧪 TEST: Attempting upsert...')
    const { data: lessonProgress, error: upsertError } = await supabase
      .from('lesson_progress')
      .upsert(progressData)
      .select()
      .single()

    if (upsertError) {
      console.log('🧪 TEST: Upsert failed:', upsertError)
      return NextResponse.json({ 
        error: 'Upsert failed',
        step: 'upsert',
        upsertError: upsertError.message,
        progressData
      }, { status: 500 })
    }
    
    console.log('🧪 TEST: Upsert successful:', lessonProgress)

    return NextResponse.json({ 
      success: true,
      step: 'completed',
      lessonProgress
    })
  } catch (error) {
    console.error('🧪 TEST: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      step: 'catch_block',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}