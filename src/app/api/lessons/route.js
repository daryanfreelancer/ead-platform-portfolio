import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Verify user has access to this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()

    if (courseError) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user is teacher of this course or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = course.teacher_id === user.id || profile?.role === 'admin'
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get lessons
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { course_id, title, description, content_type, video_type, video_url, video_file_url, pdf_file_url, text_content, duration, order_index, is_free_preview } = body

    // Validate required fields
    if (!course_id || !title || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', course_id)
      .single()

    if (courseError) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user is teacher of this course or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = course.teacher_id === user.id || profile?.role === 'admin'
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Helper function to detect video type from URL
    const detectVideoType = (url, originalType) => {
      if (originalType === 'upload') return 'upload'
      if (!url) return 'external'
      
      const urlLower = url.toLowerCase()
      if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        return 'youtube'
      }
      if (urlLower.includes('vimeo.com')) {
        return 'vimeo'
      }
      return 'external'
    }

    // Determine the actual video type for database
    const actualVideoType = content_type === 'video' 
      ? detectVideoType(video_url, video_type)
      : null

    // Create lesson
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert([{
        course_id,
        title,
        description: description || null,
        content_type: content_type || 'video',
        video_type: actualVideoType,
        video_url: content_type === 'video' && (video_type === 'url' || video_url) ? video_url : null,
        video_file_url: content_type === 'video' && video_type === 'upload' ? video_file_url : null,
        pdf_file_url: content_type === 'pdf' ? pdf_file_url : null,
        text_content: content_type === 'text' ? text_content : null,
        duration: parseInt(duration),
        order_index: order_index || 1,
        is_free_preview: is_free_preview || false
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}