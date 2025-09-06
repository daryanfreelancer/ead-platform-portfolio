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

    const { direction } = await request.json()

    if (!direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json({ error: 'Direção inválida' }, { status: 400 })
    }

    // Buscar questão atual
    const { data: currentQuestion } = await supabase
      .from('evaluation_questions')
      .select(`
        id,
        order_index,
        evaluation_id,
        evaluation:evaluations (
          id,
          course:courses (teacher_id)
        )
      `)
      .eq('id', questionId)
      .single()

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    // Verificar permissão
    if (profile.role === 'teacher' && currentQuestion.evaluation.course.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado à questão' }, { status: 403 })
    }

    // Buscar todas as questões da avaliação ordenadas
    const { data: allQuestions } = await supabase
      .from('evaluation_questions')
      .select('id, order_index')
      .eq('evaluation_id', currentQuestion.evaluation_id)
      .order('order_index', { ascending: true })

    if (!allQuestions || allQuestions.length <= 1) {
      return NextResponse.json({ error: 'Não há questões suficientes para reordenar' }, { status: 400 })
    }

    // Encontrar índice atual
    const currentIndex = allQuestions.findIndex(q => q.id === questionId)
    
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Questão não encontrada na lista' }, { status: 404 })
    }

    // Determinar novo índice
    let newIndex
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'down' && currentIndex < allQuestions.length - 1) {
      newIndex = currentIndex + 1
    } else {
      return NextResponse.json({ error: 'Movimento inválido' }, { status: 400 })
    }

    // Trocar posições
    const questionToSwap = allQuestions[newIndex]
    const updates = []

    // Atualizar questão atual
    updates.push(
      supabase
        .from('evaluation_questions')
        .update({ order_index: questionToSwap.order_index })
        .eq('id', questionId)
    )

    // Atualizar questão que será trocada
    updates.push(
      supabase
        .from('evaluation_questions')
        .update({ order_index: currentQuestion.order_index })
        .eq('id', questionToSwap.id)
    )

    // Executar atualizações
    const results = await Promise.all(updates)
    
    for (const result of results) {
      if (result.error) {
        console.error('Erro ao reordenar questões:', result.error)
        return NextResponse.json({ error: 'Erro ao reordenar questões' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de reordenação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}