import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se usuário está autenticado
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

    // Obter dados do corpo da requisição
    const { enabled } = await request.json()

    // Buscar configuração existente
    const { data: existingConfig } = await supabase
      .from('sie_api_config')
      .select('id')
      .single()

    if (existingConfig) {
      // Atualizar configuração existente
      const { error } = await supabase
        .from('sie_api_config')
        .update({ 
          sync_enabled: enabled,
          last_sync: new Date().toISOString()
        })
        .eq('id', existingConfig.id)

      if (error) throw error
    } else {
      // Criar nova configuração
      const { error } = await supabase
        .from('sie_api_config')
        .insert([{
          api_token: process.env.SIE_API_TOKEN || '',
          base_url: 'https://www.iped.com.br',
          api_version: '1.0',
          sync_enabled: enabled,
          rate_limit_per_minute: 60,
          timeout_seconds: 30
        }])

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled 
        ? 'API SIE ativada com sucesso'
        : 'API SIE pausada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao alterar status SIE:', error)
    return NextResponse.json({ 
      error: 'Erro ao alterar status da API SIE',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se usuário está autenticado
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

    // Buscar configuração atual
    const { data: config, error: configError } = await supabase
      .from('sie_api_config')
      .select('sync_enabled')
      .single()

    // Debug logs
    console.log('SIE API Config Query Result:', { config, configError })
    console.log('Config sync_enabled value:', config?.sync_enabled)
    console.log('Config sync_enabled type:', typeof config?.sync_enabled)
    console.log('Config sync_enabled === true:', config?.sync_enabled === true)
    console.log('Config sync_enabled === false:', config?.sync_enabled === false)

    // Contar cursos SIE
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_sie_course', true)

    const enabledValue = config?.sync_enabled === true
    
    return NextResponse.json({
      enabled: enabledValue,
      courseCount: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar status SIE:', error)
    return NextResponse.json({ 
      error: 'Erro ao buscar status da API SIE',
      details: error.message 
    }, { status: 500 })
  }
}