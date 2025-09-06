import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        user: null
      }, { status: 401 })
    }

    // Check legacy_certificates table
    const { data: certificates, error: certsError } = await supabase
      .from('legacy_certificates')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    // Check enrollments with completed_at
    const { data: completedEnrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        course_id,
        progress,
        completed_at,
        courses (
          title
        )
      `)
      .eq('student_id', user.id)
      .not('completed_at', 'is', null)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      certificates: certificates || [],
      certificatesCount: certificates?.length || 0,
      completedEnrollments: completedEnrollments || [],
      completedEnrollmentsCount: completedEnrollments?.length || 0,
      certificatesError: certsError?.message || null,
      enrollmentsError: enrollError?.message || null
    })

  } catch (error) {
    console.error('Test certificates error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}