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

    // Verificar se é admin ou professor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { evaluationId, isActive, reason } = await request.json()

    if (!evaluationId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Se for professor, verificar se a avaliação pertence a ele
    if (profile.role === 'teacher') {
      const { data: evaluation } = await supabase
        .from('evaluations')
        .select(`
          id,
          course:courses (teacher_id)
        `)
        .eq('id', evaluationId)
        .single()

      if (!evaluation || evaluation.course.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Acesso negado à avaliação' }, { status: 403 })
      }
    }

    // Usar a função do banco de dados para alternar ativação
    const { error: toggleError } = await supabase
      .rpc('toggle_evaluation_activation', {
        evaluation_id: evaluationId,
        is_active: isActive
      })

    if (toggleError) {
      console.error('Erro ao alternar ativação da avaliação:', toggleError)
      return NextResponse.json({ error: 'Erro ao alternar ativação da avaliação' }, { status: 500 })
    }

    // Se foi fornecido um motivo, atualizar o log de auditoria
    if (reason) {
      const { error: updateError } = await supabase
        .from('activation_audit_log')
        .update({ reason })
        .eq('entity_type', 'evaluation')
        .eq('entity_id', evaluationId)
        .eq('admin_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (updateError) {
        console.error('Erro ao atualizar motivo:', updateError)
        // Não retornar erro aqui, pois a ativação foi bem-sucedida
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: isActive ? 'Avaliação ativada com sucesso' : 'Avaliação desativada com sucesso' 
    })
  } catch (error) {
    console.error('Erro na API de ativação de avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}