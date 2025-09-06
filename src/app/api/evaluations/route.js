import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')
    const moduleId = searchParams.get('moduleId')
    
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar avaliações com informações relacionadas
    let query = supabase
      .from('evaluations')
      .select(`
        *,
        course:courses (
          id,
          title,
          teacher:profiles!teacher_id (
            id,
            full_name
          )
        ),
        lesson:lessons (
          id,
          title
        ),
        questions:evaluation_questions (
          id,
          question_text,
          question_type,
          points,
          order_index
        )
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros se fornecidos
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }
    
    // Nota: module_id não existe na tabela evaluations

    const { data: evaluations, error } = await query

    if (error) {
      console.error('Erro ao buscar avaliações:', error)
      return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
    }

    return NextResponse.json({ evaluations: evaluations || [] })
  } catch (error) {
    console.error('Erro na API de avaliações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é professor ou admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const {
      courseId,
      lessonId,
      title,
      description,
      instructions,
      timeLimit,
      maxAttempts,
      passingScore,
      randomizeQuestions,
      showResultsImmediately,
      showCorrectAnswers
    } = await request.json()

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // Verificar se o usuário tem permissão para o curso
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    if (profile.role === 'teacher' && course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado ao curso' }, { status: 403 })
    }

    // Criar nova avaliação
    const { data: newEvaluation, error } = await supabase
      .from('evaluations')
      .insert({
        course_id: courseId,
        lesson_id: lessonId || null,
        title,
        description,
        instructions,
        time_limit: timeLimit || null,
        max_attempts: maxAttempts || 1,
        passing_score: passingScore || 70.00,
        randomize_questions: randomizeQuestions || false,
        show_results_immediately: showResultsImmediately !== false,
        show_correct_answers: showCorrectAnswers !== false,
        created_by: user.id,
        is_active: true
      })
      .select(`
        *,
        course:courses (
          id,
          title,
          teacher:profiles!teacher_id (
            id,
            full_name
          )
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar avaliação:', error)
      return NextResponse.json({ error: 'Erro ao criar avaliação' }, { status: 500 })
    }

    return NextResponse.json({ evaluation: newEvaluation })
  } catch (error) {
    console.error('Erro na API de criação de avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}