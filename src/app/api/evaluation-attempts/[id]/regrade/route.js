import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const attemptId = params.id
    
    // Verificar se o usuário está autenticado e é professor/admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { textAnswers } = await request.json()

    if (!textAnswers || typeof textAnswers !== 'object') {
      return NextResponse.json({ error: 'Notas para questões dissertativas são obrigatórias' }, { status: 400 })
    }

    // Buscar a tentativa
    const { data: attempt, error: attemptError } = await supabase
      .from('evaluation_attempts')
      .select(`
        *,
        evaluation:evaluations (
          *,
          questions:evaluation_questions (
            id,
            question_text,
            question_type,
            points,
            is_required,
            options:question_options (
              id,
              option_text,
              is_correct
            )
          )
        ),
        answers:evaluation_answers (
          question_id,
          answer_data
        )
      `)
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Tentativa não encontrada' }, { status: 404 })
    }

    const evaluation = attempt.evaluation
    const questions = evaluation.questions || []
    const existingAnswers = {}
    
    // Converter respostas existentes
    attempt.answers?.forEach(answer => {
      try {
        existingAnswers[answer.question_id] = JSON.parse(answer.answer_data)
      } catch (e) {
        existingAnswers[answer.question_id] = answer.answer_data
      }
    })

    // Recalcular pontuação incluindo questões dissertativas
    let totalScore = 0
    let maxPossibleScore = 0

    for (const question of questions) {
      maxPossibleScore += question.points || 1
      const userAnswer = existingAnswers[question.id]
      let questionScore = 0

      if (question.question_type === 'text') {
        // Usar nota manual fornecida pelo professor
        questionScore = textAnswers[question.id] || 0
      } else if (question.options && question.options.length > 0) {
        // Recalcular questões objetivas (mesmo algoritmo da submissão)
        const correctOptions = question.options.filter(opt => opt.is_correct)
        const correctOptionIds = correctOptions.map(opt => opt.id)
        
        if (question.question_type === 'true_false') {
          if (Array.isArray(userAnswer) && userAnswer.length === 1) {
            const isCorrect = correctOptionIds.includes(userAnswer[0])
            if (isCorrect) {
              questionScore = question.points || 1
            }
          }
        } else if (question.question_type === 'multiple_choice') {
          if (Array.isArray(userAnswer)) {
            const userAnswerSet = new Set(userAnswer)
            const correctAnswerSet = new Set(correctOptionIds)
            
            const isExactMatch = userAnswerSet.size === correctAnswerSet.size &&
              [...userAnswerSet].every(id => correctAnswerSet.has(id))
            
            if (isExactMatch) {
              questionScore = question.points || 1
            } else {
              const correctSelected = userAnswer.filter(id => correctOptionIds.includes(id)).length
              const incorrectSelected = userAnswer.filter(id => !correctOptionIds.includes(id)).length
              const totalCorrect = correctOptionIds.length
              
              if (correctSelected > 0 && incorrectSelected === 0) {
                questionScore = (correctSelected / totalCorrect) * (question.points || 1)
              }
            }
          }
        }
      }

      totalScore += questionScore
    }

    // Calcular porcentagem e aprovação
    const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
    const passed = scorePercentage >= (evaluation.passing_score || 70)

    // Atualizar tentativa
    const { error: updateError } = await supabase
      .from('evaluation_attempts')
      .update({
        total_score: scorePercentage,
        passed,
        status: 'graded'
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Erro ao atualizar tentativa:', updateError)
      return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })
    }

    // Log de auditoria
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'evaluation_regraded',
        entity_type: 'evaluation_attempt',
        entity_id: attemptId,
        metadata: {
          evaluation_id: evaluation.id,
          old_score: attempt.total_score,
          new_score: scorePercentage,
          text_scores: textAnswers
        }
      })

    return NextResponse.json({
      success: true,
      newScore: Math.round(scorePercentage * 100) / 100,
      passed,
      totalScore: Math.round(totalScore * 100) / 100,
      maxPossibleScore
    })
  } catch (error) {
    console.error('Erro ao reavaliar tentativa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}