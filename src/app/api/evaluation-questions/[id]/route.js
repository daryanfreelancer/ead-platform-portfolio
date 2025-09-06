import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const questionId = params.id
    
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
      questionText,
      questionType,
      points,
      explanation,
      isRequired,
      options
    } = await request.json()

    if (!questionText || !questionType) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // Verificar se a questão existe e se o usuário tem permissão
    const { data: existingQuestion } = await supabase
      .from('evaluation_questions')
      .select(`
        id,
        evaluation:evaluations (
          id,
          course:courses (teacher_id)
        )
      `)
      .eq('id', questionId)
      .single()

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    if (profile.role === 'teacher' && existingQuestion.evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado à questão' }, { status: 403 })
    }

    // Atualizar questão
    const { error: updateError } = await supabase
      .from('evaluation_questions')
      .update({
        question_text: questionText,
        question_type: questionType,
        points: points || 1,
        explanation: explanation || null,
        is_required: isRequired !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)

    if (updateError) {
      console.error('Erro ao atualizar questão:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar questão' }, { status: 500 })
    }

    // Deletar opções existentes se for questão dissertativa
    if (questionType === 'text') {
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', questionId)
    } else if (options && Array.isArray(options)) {
      // Deletar opções antigas
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', questionId)

      // Inserir novas opções
      if (options.length > 0) {
        const optionsToInsert = options.map((option, index) => ({
          question_id: questionId,
          option_text: option.optionText,
          is_correct: option.isCorrect || false,
          order_index: option.orderIndex || index,
          explanation: option.explanation || null
        }))

        const { error: optionsError } = await supabase
          .from('question_options')
          .insert(optionsToInsert)

        if (optionsError) {
          console.error('Erro ao inserir opções:', optionsError)
          return NextResponse.json({ error: 'Erro ao salvar opções da questão' }, { status: 500 })
        }
      }
    }

    // Buscar questão atualizada com opções
    const { data: updatedQuestion } = await supabase
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
      .eq('id', questionId)
      .single()

    return NextResponse.json({ 
      question: {
        ...updatedQuestion,
        options: (updatedQuestion.options || []).sort((a, b) => a.order_index - b.order_index)
      }
    })
  } catch (error) {
    console.error('Erro na API de questões (PUT):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const questionId = params.id
    
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

    // Verificar se a questão existe e se o usuário tem permissão
    const { data: existingQuestion } = await supabase
      .from('evaluation_questions')
      .select(`
        id,
        evaluation:evaluations (
          id,
          course:courses (teacher_id)
        )
      `)
      .eq('id', questionId)
      .single()

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    if (profile.role === 'teacher' && existingQuestion.evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado à questão' }, { status: 403 })
    }

    // Verificar se há tentativas de avaliação que usam esta questão
    const { data: attempts } = await supabase
      .from('evaluation_attempts')
      .select('id')
      .eq('evaluation_id', existingQuestion.evaluation.id)
      .limit(1)

    if (attempts && attempts.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar a questão pois já existem tentativas de avaliação registradas' 
      }, { status: 400 })
    }

    // Deletar questão (as opções são deletadas automaticamente por CASCADE)
    const { error } = await supabase
      .from('evaluation_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Erro ao deletar questão:', error)
      return NextResponse.json({ error: 'Erro ao deletar questão' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de questões (DELETE):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}