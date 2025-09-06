import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sieApiClient } from '@/lib/sie-api/client'

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se usuário está autenticado
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

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se a API SIE está habilitada no banco
    const { data: config } = await supabase
      .from('sie_api_config')
      .select('sync_enabled')
      .single()

    if (!config?.sync_enabled) {
      return NextResponse.json({ 
        enabled: false,
        message: 'API SIE está pausada pelo administrador'
      })
    }

    // Verificar conectividade com a API SIE
    const apiStatus = await sieApiClient.checkApiStatus()

    return NextResponse.json({
      enabled: true,
      apiAvailable: apiStatus,
      message: apiStatus ? 'API SIE está funcionando' : 'API SIE está indisponível'
    })

  } catch (error) {
    console.error('Erro ao verificar status SIE:', error)
    return NextResponse.json({ 
      enabled: false,
      apiAvailable: false,
      message: 'Erro ao verificar status da API SIE',
      error: error.message 
    }, { status: 500 })
  }
}