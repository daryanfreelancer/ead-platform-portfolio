import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'ID do curso é obrigatório' }, { status: 400 })
    }

    console.log(`[DEBUG] Verificando matrícula - User: ${user.id}, Course: ${courseId}`)

    // Tentar verificação de matrícula com logs detalhados
    try {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, student_id, course_id, created_at')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single()

      console.log(`[DEBUG] Query result - Error:`, enrollmentError)
      console.log(`[DEBUG] Query result - Data:`, enrollment)

      return NextResponse.json({
        success: true,
        hasEnrollment: !!enrollment,
        enrollment: enrollment,
        error: enrollmentError,
        userId: user.id,
        courseId: courseId
      })

    } catch (queryError) {
      console.error(`[DEBUG] Query exception:`, queryError)
      
      return NextResponse.json({
        success: false,
        error: 'Erro na consulta de matrícula',
        details: queryError.message,
        userId: user.id,
        courseId: courseId
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro geral na verificação de matrícula:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}