import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { evaluationId } = await request.json()

    if (!evaluationId) {
      return NextResponse.json({ error: 'ID da avaliação é obrigatório' }, { status: 400 })
    }

    // Verificar se a avaliação existe e está ativa
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .eq('is_active', true)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    // Verificar se o usuário está matriculado no curso
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', evaluation.course_id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Usuário não matriculado neste curso' }, { status: 403 })
    }

    // Verificar tentativas anteriores
    const { data: existingAttempts } = await supabase
      .from('evaluation_attempts')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: false })

    // Verificar se já passou na avaliação
    const hasPassedAttempt = existingAttempts?.some(attempt => 
      attempt.passed === true
    )

    if (hasPassedAttempt) {
      return NextResponse.json({ error: 'Você já foi aprovado nesta avaliação' }, { status: 400 })
    }

    // Verificar limite de tentativas
    const attemptCount = existingAttempts?.length || 0
    if (attemptCount >= evaluation.max_attempts) {
      return NextResponse.json({ error: 'Limite de tentativas excedido' }, { status: 400 })
    }

    // Verificar se há tentativa em andamento
    const inProgressAttempt = existingAttempts?.find(attempt => 
      attempt.status === 'in_progress'
    )

    if (inProgressAttempt) {
      // Retornar tentativa existente
      return NextResponse.json({ attempt: inProgressAttempt })
    }

    // Criar nova tentativa
    const { data: newAttempt, error } = await supabase
      .from('evaluation_attempts')
      .insert({
        evaluation_id: evaluationId,
        student_id: user.id,
        attempt_number: attemptCount + 1,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tentativa:', error)
      return NextResponse.json({ error: 'Erro ao iniciar avaliação' }, { status: 500 })
    }

    return NextResponse.json({ attempt: newAttempt })
  } catch (error) {
    console.error('Erro na API de tentativas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}