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

    // Buscar dados do curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    // Verificar se o curso é gratuito
    if (!course.is_free && course.price > 0) {
      return NextResponse.json({ error: 'Curso pago requer pagamento' }, { status: 400 })
    }

    // Verificar se já existe matrícula
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Usuário já matriculado neste curso' }, { status: 400 })
    }

    // Criar matrícula
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: user.id,
        enrolled_at: new Date().toISOString(),
        progress: 0
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error('Erro ao criar matrícula:', enrollmentError)
      return NextResponse.json({ error: 'Erro ao criar matrícula' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      enrollment: enrollment 
    })

  } catch (error) {
    console.error('Erro na matrícula:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}