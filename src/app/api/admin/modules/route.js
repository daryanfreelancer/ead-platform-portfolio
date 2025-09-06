import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
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

    // Buscar módulos do curso
    let query = supabase
      .from('course_modules')
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
      .order('order_index', { ascending: true })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: modules, error } = await query

    if (error) {
      console.error('Erro ao buscar módulos:', error)
      return NextResponse.json({ error: 'Erro ao buscar módulos' }, { status: 500 })
    }

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Erro na API de módulos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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

    const { courseId, title, description } = await request.json()

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // Obter próximo order_index
    const { data: lastModule } = await supabase
      .from('course_modules')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = lastModule && lastModule.length > 0 ? lastModule[0].order_index + 1 : 0

    // Criar novo módulo
    const { data: newModule, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title,
        description,
        order_index: nextOrderIndex,
        is_active: true
      })
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
      console.error('Erro ao criar módulo:', error)
      return NextResponse.json({ error: 'Erro ao criar módulo' }, { status: 500 })
    }

    return NextResponse.json({ module: newModule })
  } catch (error) {
    console.error('Erro na API de criação de módulo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}