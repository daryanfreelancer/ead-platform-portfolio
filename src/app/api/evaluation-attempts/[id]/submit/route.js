import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const attemptId = params.id
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { answers } = await request.json()

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Respostas são obrigatórias' }, { status: 400 })
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
        )
      `)
      .eq('id', attemptId)
      .eq('student_id', user.id)
      .eq('status', 'in_progress')
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Tentativa não encontrada' }, { status: 404 })
    }

    const evaluation = attempt.evaluation
    const questions = evaluation.questions || []

    // Calcular pontuação
    let totalScore = 0
    let maxPossibleScore = 0
    const detailedResults = []

    for (const question of questions) {
      maxPossibleScore += question.points || 1
      const userAnswer = answers[question.id]
      let questionScore = 0
      let isCorrect = false

      if (question.question_type === 'text') {
        // Questões dissertativas precisam ser corrigidas manualmente
        // Por enquanto, não damos pontos automáticos
        questionScore = 0
        isCorrect = null // null indica que precisa correção manual
      } else if (question.options && question.options.length > 0) {
        const correctOptions = question.options.filter(opt => opt.is_correct)
        const correctOptionIds = correctOptions.map(opt => opt.id)
        
        if (question.question_type === 'true_false') {
          // Verdadeiro/Falso: deve ter exatamente uma resposta correta
          if (Array.isArray(userAnswer) && userAnswer.length === 1) {
            isCorrect = correctOptionIds.includes(userAnswer[0])
            if (isCorrect) {
              questionScore = question.points || 1
            }
          }
        } else if (question.question_type === 'multiple_choice') {
          // Múltipla escolha: pode ter várias respostas corretas
          if (Array.isArray(userAnswer)) {
            const userAnswerSet = new Set(userAnswer)
            const correctAnswerSet = new Set(correctOptionIds)
            
            // Verificar se as respostas são exatamente iguais
            const isExactMatch = userAnswerSet.size === correctAnswerSet.size &&
              [...userAnswerSet].every(id => correctAnswerSet.has(id))
            
            if (isExactMatch) {
              isCorrect = true
              questionScore = question.points || 1
            } else {
              // Pontuação parcial baseada em acertos vs erros
              const correctSelected = userAnswer.filter(id => correctOptionIds.includes(id)).length
              const incorrectSelected = userAnswer.filter(id => !correctOptionIds.includes(id)).length
              const totalCorrect = correctOptionIds.length
              
              if (correctSelected > 0 && incorrectSelected === 0) {
                // Apenas respostas corretas selecionadas, mas não todas
                questionScore = (correctSelected / totalCorrect) * (question.points || 1)
                isCorrect = correctSelected === totalCorrect
              }
            }
          }
        }
      }

      totalScore += questionScore
      
      detailedResults.push({
        questionId: question.id,
        questionText: question.question_text,
        userAnswer: userAnswer,
        correctAnswer: question.options?.filter(opt => opt.is_correct).map(opt => opt.id) || null,
        isCorrect,
        pointsAwarded: questionScore,
        maxPoints: question.points || 1
      })
    }

    // Verificar se há questões dissertativas não corrigidas
    const hasUngradedTextQuestions = detailedResults.some(result => result.isCorrect === null)
    
    // Calcular porcentagem
    const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
    
    // Determinar status de aprovação
    let passed = null
    let status = 'submitted'
    
    if (hasUngradedTextQuestions) {
      // Tem questões dissertativas pendentes de correção
      passed = null // null = aguardando correção
      status = 'awaiting_grading'
    } else {
      // Todas as questões foram corrigidas automaticamente
      passed = scorePercentage >= (evaluation.passing_score || 70)
      status = 'graded'
    }
    
    // Calcular tempo gasto
    const startedAt = new Date(attempt.started_at)
    const submittedAt = new Date()
    const timeSpentMinutes = Math.round((submittedAt - startedAt) / (1000 * 60))

    // Atualizar tentativa
    const { error: updateError } = await supabase
      .from('evaluation_attempts')
      .update({
        submitted_at: submittedAt.toISOString(),
        time_spent: timeSpentMinutes,
        total_score: scorePercentage,
        max_possible_score: maxPossibleScore,
        passed,
        status
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Erro ao atualizar tentativa:', updateError)
      return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })
    }

    // Salvar respostas detalhadas
    const answerRecords = Object.entries(answers).map(([questionId, answer]) => ({
      attempt_id: attemptId,
      question_id: questionId,
      answer_data: JSON.stringify(answer),
      created_at: submittedAt.toISOString()
    }))

    if (answerRecords.length > 0) {
      const { error: answerError } = await supabase
        .from('evaluation_answers')
        .insert(answerRecords)

      if (answerError) {
        console.error('Erro ao salvar respostas:', answerError)
        // Não falha a operação, apenas loga o erro
      }
    }

    // Retornar resultados
    const results = {
      passed,
      score: Math.round(scorePercentage * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
      maxPossibleScore,
      timeSpent: timeSpentMinutes,
      status,
      hasUngradedQuestions: hasUngradedTextQuestions,
      showCorrectAnswers: evaluation.show_correct_answers && !hasUngradedTextQuestions,
      showResultsImmediately: evaluation.show_results_immediately,
      details: (evaluation.show_correct_answers && !hasUngradedTextQuestions) ? detailedResults : null,
      message: hasUngradedTextQuestions 
        ? 'Sua avaliação foi submetida! O resultado final será disponibilizado após a correção das questões dissertativas.'
        : passed 
          ? 'Parabéns! Você foi aprovado na avaliação!'
          : 'Você não atingiu a nota mínima para aprovação.'
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Erro ao submeter avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}