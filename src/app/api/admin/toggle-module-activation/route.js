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

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { moduleId, isActive, reason } = await request.json()

    if (!moduleId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Usar a função do banco de dados para alternar ativação
    const { error: toggleError } = await supabase
      .rpc('toggle_module_activation', {
        module_id: moduleId,
        is_active: isActive
      })

    if (toggleError) {
      console.error('Erro ao alternar ativação do módulo:', toggleError)
      return NextResponse.json({ error: 'Erro ao alternar ativação do módulo' }, { status: 500 })
    }

    // Se foi fornecido um motivo, atualizar o log de auditoria
    if (reason) {
      const { error: updateError } = await supabase
        .from('activation_audit_log')
        .update({ reason })
        .eq('entity_type', 'module')
        .eq('entity_id', moduleId)
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
      message: isActive ? 'Módulo ativado com sucesso' : 'Módulo desativado com sucesso' 
    })
  } catch (error) {
    console.error('Erro na API de ativação de módulo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}