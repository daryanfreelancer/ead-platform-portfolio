import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const attemptId = params.id
    
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

    // Buscar tentativa com detalhes completos
    const { data: attempt, error } = await supabase
      .from('evaluation_attempts')
      .select(`
        id,
        student_id,
        evaluation_id,
        started_at,
        submitted_at,
        status,
        automatic_score,
        manual_score,
        total_score,
        is_approved,
        student:profiles!evaluation_attempts_student_id_fkey (
          id,
          full_name,
          email
        ),
        evaluation:evaluations (
          id,
          title,
          description,
          passing_score,
          course:courses (
            id,
            title,
            teacher_id
          )
        )
      `)
      .eq('id', attemptId)
      .single()

    if (error || !attempt) {
      return NextResponse.json({ error: 'Tentativa não encontrada' }, { status: 404 })
    }

    // Verificar permissão (se é professor, deve ser do curso)
    if (profile.role === 'teacher' && attempt.evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado à tentativa' }, { status: 403 })
    }

    // Buscar respostas com questões
    const { data: answers, error: answersError } = await supabase
      .from('evaluation_answers')
      .select(`
        id,
        question_id,
        answer_data,
        automatic_score,
        manual_score,
        manual_feedback,
        question:evaluation_questions (
          id,
          question_text,
          question_type,
          points,
          explanation,
          options:question_options (
            id,
            option_text,
            is_correct,
            order_index
          )
        )
      `)
      .eq('attempt_id', attemptId)
      .order('question.order_index', { ascending: true })

    if (answersError) {
      console.error('Erro ao buscar respostas:', answersError)
      return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
    }

    // Organizar dados da resposta
    const processedAnswers = (answers || []).map(answer => ({
      ...answer,
      question: {
        ...answer.question,
        options: (answer.question.options || []).sort((a, b) => a.order_index - b.order_index)
      }
    }))

    const attemptWithAnswers = {
      ...attempt,
      answers: processedAnswers
    }

    return NextResponse.json({ attempt: attemptWithAnswers })
  } catch (error) {
    console.error('Erro na API de detalhes da tentativa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}