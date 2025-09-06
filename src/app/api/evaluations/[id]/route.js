import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar avaliação com todas as informações relacionadas
    const { data: evaluation, error } = await supabase
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
        module:course_modules (
          id,
          title
        ),
        questions:evaluation_questions (
          id,
          question_text,
          question_type,
          points,
          order_index,
          explanation,
          is_required,
          options:question_options (
            id,
            option_text,
            is_correct,
            order_index,
            explanation
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    // Ordenar questões e opções
    if (evaluation.questions) {
      evaluation.questions.sort((a, b) => a.order_index - b.order_index)
      evaluation.questions.forEach(question => {
        if (question.options) {
          question.options.sort((a, b) => a.order_index - b.order_index)
        }
      })
    }

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Erro na API de avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    
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

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    // Verificar se a avaliação existe e se o usuário tem permissão
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select(`
        *,
        course:courses (teacher_id)
      `)
      .eq('id', id)
      .single()

    if (!evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    if (profile.role === 'teacher' && evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Atualizar avaliação
    const { data: updatedEvaluation, error } = await supabase
      .from('evaluations')
      .update({
        title,
        description,
        instructions,
        time_limit: timeLimit || null,
        max_attempts: maxAttempts || 1,
        passing_score: passingScore || 70.00,
        randomize_questions: randomizeQuestions || false,
        show_results_immediately: showResultsImmediately !== false,
        show_correct_answers: showCorrectAnswers !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      console.error('Erro ao atualizar avaliação:', error)
      return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 })
    }

    return NextResponse.json({ evaluation: updatedEvaluation })
  } catch (error) {
    console.error('Erro na API de atualização de avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    
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

    // Verificar se a avaliação existe e se o usuário tem permissão
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select(`
        *,
        course:courses (teacher_id)
      `)
      .eq('id', id)
      .single()

    if (!evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    if (profile.role === 'teacher' && evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se há tentativas associadas
    const { data: attempts } = await supabase
      .from('evaluation_attempts')
      .select('id')
      .eq('evaluation_id', id)
      .limit(1)

    if (attempts && attempts.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar avaliação com tentativas de estudantes' 
      }, { status: 400 })
    }

    // Deletar avaliação (cascata deleta questões e opções)
    const { error: deleteError } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar avaliação:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar avaliação' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Avaliação deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro na API de exclusão de avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}