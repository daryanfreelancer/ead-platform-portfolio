import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get lesson with course info
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        *,
        courses (
          id,
          title,
          teacher_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if user has access to this lesson
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = lesson.courses.teacher_id === user.id || profile?.role === 'admin'
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { title, description, content_type, video_type, video_url, video_file_url, pdf_file_url, text_content, duration, order_index, is_free_preview } = body

    // Get lesson with course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        courses (
          id,
          title,
          teacher_id
        )
      `)
      .eq('id', id)
      .single()

    if (lessonError) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if user has access to this lesson
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = lesson.courses.teacher_id === user.id || profile?.role === 'admin'
    
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

    // Update lesson
    const updateData = {
      title: title || lesson.title,
      description: description !== undefined ? description : lesson.description,
      content_type: content_type || lesson.content_type,
      video_type: actualVideoType,
      video_url: content_type === 'video' && (video_type === 'url' || video_url) ? video_url : null,
      video_file_url: content_type === 'video' && video_type === 'upload' ? video_file_url : null,
      pdf_file_url: content_type === 'pdf' ? pdf_file_url : null,
      text_content: content_type === 'text' ? text_content : null,
      duration: duration ? parseInt(duration) : lesson.duration,
      order_index: order_index !== undefined ? order_index : lesson.order_index,
      is_free_preview: is_free_preview !== undefined ? is_free_preview : lesson.is_free_preview
    }

    const { data: updatedLesson, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get lesson with course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        courses (
          id,
          title,
          teacher_id
        )
      `)
      .eq('id', id)
      .single()

    if (lessonError) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if user has access to this lesson
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = lesson.courses.teacher_id === user.id || profile?.role === 'admin'
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete lesson
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}