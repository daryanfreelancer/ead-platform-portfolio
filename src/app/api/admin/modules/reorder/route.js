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

    const { courseId, moduleOrders } = await request.json()

    if (!courseId || !Array.isArray(moduleOrders)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Usar a função do banco de dados para reordenar módulos
    const { error: reorderError } = await supabase
      .rpc('reorder_modules', {
        course_id: courseId,
        module_orders: moduleOrders
      })

    if (reorderError) {
      console.error('Erro ao reordenar módulos:', reorderError)
      return NextResponse.json({ error: 'Erro ao reordenar módulos' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Módulos reordenados com sucesso' 
    })
  } catch (error) {
    console.error('Erro na API de reordenação de módulos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}