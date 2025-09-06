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

    // Verificar se a API SIE está habilitada
    const { data: config } = await supabase
      .from('sie_api_config')
      .select('sync_enabled')
      .single()

    if (!config?.sync_enabled) {
      return NextResponse.json({ 
        error: 'API SIE está pausada. Contate o administrador.' 
      }, { status: 503 })
    }

    // Buscar categorias da API SIE
    const response = await sieApiClient.getCategories()

    // Transformar dados para formato padronizado
    const categories = response.CATEGORIES ? response.CATEGORIES.map(cat => ({
      id: cat.category_id || cat.id,
      name: cat.category_name || cat.name,
      description: cat.category_description || cat.description,
      courses_count: cat.courses_count || 0
    })) : []

    return NextResponse.json({
      success: true,
      categories
    })

  } catch (error) {
    console.error('Erro ao buscar categorias SIE:', error)
    return NextResponse.json({ 
      error: 'Erro ao buscar categorias',
      details: error.message 
    }, { status: 500 })
  }
}