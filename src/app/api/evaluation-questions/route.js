import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const evaluationId = searchParams.get('evaluationId')
    
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!evaluationId) {
      return NextResponse.json({ error: 'ID da avaliação é obrigatório' }, { status: 400 })
    }

    // Buscar questões com opções
    const { data: questions, error } = await supabase
      .from('evaluation_questions')
      .select(`
        *,
        options:question_options (
          id,
          option_text,
          is_correct,
          order_index,
          explanation
        )
      `)
      .eq('evaluation_id', evaluationId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
    }

    // Ordenar opções dentro de cada questão
    const questionsWithSortedOptions = (questions || []).map(question => ({
      ...question,
      options: (question.options || []).sort((a, b) => a.order_index - b.order_index)
    }))

    return NextResponse.json({ questions: questionsWithSortedOptions })
  } catch (error) {
    console.error('Erro na API de questões:', error)
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
      evaluationId,
      questionText,
      questionType,
      points,
      explanation,
      isRequired,
      options
    } = await request.json()

    if (!evaluationId || !questionText || !questionType) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // Verificar se o usuário tem permissão para a avaliação
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select(`
        id,
        course:courses (teacher_id)
      `)
      .eq('id', evaluationId)
      .single()

    if (!evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    if (profile.role === 'teacher' && evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado à avaliação' }, { status: 403 })
    }

    // Obter próximo order_index
    const { data: lastQuestion } = await supabase
      .from('evaluation_questions')
      .select('order_index')
      .eq('evaluation_id', evaluationId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = lastQuestion && lastQuestion.length > 0 ? lastQuestion[0].order_index + 1 : 0

    // Criar nova questão
    const { data: newQuestion, error: questionError } = await supabase
      .from('evaluation_questions')
      .insert({
        evaluation_id: evaluationId,
        question_text: questionText,
        question_type: questionType,
        points: points || 1.00,
        order_index: nextOrderIndex,
        explanation,
        is_required: isRequired !== false
      })
      .select()
      .single()

    if (questionError) {
      console.error('Erro ao criar questão:', questionError)
      return NextResponse.json({ error: 'Erro ao criar questão' }, { status: 500 })
    }

    // Se há opções, criar opções da questão
    if (options && Array.isArray(options) && options.length > 0) {
      const optionsToInsert = options.map((option, index) => ({
        question_id: newQuestion.id,
        option_text: option.text,
        is_correct: option.isCorrect || false,
        order_index: index,
        explanation: option.explanation || null
      }))

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert)

      if (optionsError) {
        console.error('Erro ao criar opções:', optionsError)
        // Deletar questão se falhou ao criar opções
        await supabase.from('evaluation_questions').delete().eq('id', newQuestion.id)
        return NextResponse.json({ error: 'Erro ao criar opções da questão' }, { status: 500 })
      }
    }

    // Buscar questão completa com opções
    const { data: completeQuestion } = await supabase
      .from('evaluation_questions')
      .select(`
        *,
        options:question_options (
          id,
          option_text,
          is_correct,
          order_index,
          explanation
        )
      `)
      .eq('id', newQuestion.id)
      .single()

    return NextResponse.json({ question: completeQuestion })
  } catch (error) {
    console.error('Erro na API de criação de questão:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}