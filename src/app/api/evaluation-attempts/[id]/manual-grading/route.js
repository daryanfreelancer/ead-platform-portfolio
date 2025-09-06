import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request, { params }) {
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

    const { grades, feedback } = await request.json()

    if (!grades || typeof grades !== 'object') {
      return NextResponse.json({ error: 'Dados de notas inválidos' }, { status: 400 })
    }

    // Buscar tentativa com detalhes
    const { data: attempt, error: attemptError } = await supabase
      .from('evaluation_attempts')
      .select(`
        id,
        student_id,
        evaluation_id,
        automatic_score,
        evaluation:evaluations (
          id,
          passing_score,
          course:courses (
            id,
            teacher_id
          )
        )
      `)
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Tentativa não encontrada' }, { status: 404 })
    }

    // Verificar permissão (se é professor, deve ser do curso)
    if (profile.role === 'teacher' && attempt.evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado à tentativa' }, { status: 403 })
    }

    // Buscar questões dissertativas desta tentativa
    const { data: essayAnswers, error: essayError } = await supabase
      .from('evaluation_answers')
      .select(`
        id,
        question_id,
        question:evaluation_questions!inner (
          id,
          question_type,
          points
        )
      `)
      .eq('attempt_id', attemptId)
      .eq('question.question_type', 'text')

    if (essayError) {
      console.error('Erro ao buscar questões dissertativas:', essayError)
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
    }

    // Atualizar cada resposta dissertativa com nota e feedback
    let manualScore = 0
    const updatePromises = []

    for (const answer of essayAnswers || []) {
      const questionId = answer.question.id
      const grade = parseFloat(grades[questionId]) || 0
      const feedbackText = feedback[questionId] || null

      // Validar nota
      const maxScore = answer.question.points || 1
      const finalGrade = Math.min(Math.max(0, grade), maxScore)
      
      manualScore += finalGrade

      updatePromises.push(
        supabase
          .from('evaluation_answers')
          .update({
            manual_score: finalGrade,
            manual_feedback: feedbackText,
            updated_at: new Date().toISOString()
          })
          .eq('id', answer.id)
      )
    }

    // Executar todas as atualizações
    const updateResults = await Promise.all(updatePromises)
    
    for (const result of updateResults) {
      if (result.error) {
        console.error('Erro ao atualizar resposta:', result.error)
        return NextResponse.json({ error: 'Erro ao salvar notas' }, { status: 500 })
      }
    }

    // Calcular nota total e aprovação
    const automaticScore = attempt.automatic_score || 0
    const totalScore = automaticScore + manualScore
    
    // Buscar total de pontos possíveis da avaliação
    const { data: totalPointsResult } = await supabase
      .from('evaluation_questions')
      .select('points')
      .eq('evaluation_id', attempt.evaluation_id)

    const totalPossiblePoints = (totalPointsResult || []).reduce(
      (sum, question) => sum + (question.points || 0), 
      0
    )

    // Calcular porcentagem e aprovação
    const percentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0
    const isApproved = percentage >= attempt.evaluation.passing_score

    // Atualizar tentativa com notas finais
    const { error: updateAttemptError } = await supabase
      .from('evaluation_attempts')
      .update({
        manual_score: manualScore,
        total_score: totalScore,
        is_approved: isApproved,
        status: 'graded',
        graded_at: new Date().toISOString(),
        graded_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)

    if (updateAttemptError) {
      console.error('Erro ao atualizar tentativa:', updateAttemptError)
      return NextResponse.json({ error: 'Erro ao finalizar correção' }, { status: 500 })
    }

    // Criar notificação para o aluno
    await createStudentNotification(supabase, {
      studentId: attempt.student_id,
      evaluationId: attempt.evaluation_id,
      attemptId: attemptId,
      isApproved,
      totalScore,
      totalPossiblePoints,
      percentage
    })

    return NextResponse.json({ 
      success: true,
      attempt: {
        id: attemptId,
        manual_score: manualScore,
        total_score: totalScore,
        is_approved: isApproved,
        percentage: Math.round(percentage * 100) / 100
      }
    })
  } catch (error) {
    console.error('Erro na API de correção manual:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para criar notificação do aluno
async function createStudentNotification(supabase, {
  studentId,
  evaluationId,
  attemptId,
  isApproved,
  totalScore,
  totalPossiblePoints,
  percentage
}) {
  try {
    // Buscar dados da avaliação para a notificação
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select(`
        title,
        course:courses (
          title
        )
      `)
      .eq('id', evaluationId)
      .single()

    if (!evaluation) return

    const title = isApproved 
      ? `Parabéns! Você foi aprovado na avaliação "${evaluation.title}"`
      : `Resultado da avaliação "${evaluation.title}"`

    const message = isApproved
      ? `Você foi aprovado na avaliação "${evaluation.title}" do curso "${evaluation.course.title}" com ${percentage.toFixed(1)}% (${totalScore}/${totalPossiblePoints} pontos). Parabéns pelo seu desempenho!`
      : `Sua avaliação "${evaluation.title}" do curso "${evaluation.course.title}" foi corrigida. Você obteve ${percentage.toFixed(1)}% (${totalScore}/${totalPossiblePoints} pontos). Continue estudando e tente novamente!`

    // Inserir notificação
    await supabase
      .from('notifications')
      .insert([{
        user_id: studentId,
        title,
        message,
        type: 'evaluation_result',
        related_id: attemptId,
        is_read: false,
        created_at: new Date().toISOString()
      }])

  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    // Não falhar a correção por causa da notificação
  }
}