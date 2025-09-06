import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
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

    // Buscar cursos - admin vê todos, professor vê apenas os seus
    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        status,
        is_active,
        teacher_id,
        created_at
      `)
      .order('title', { ascending: true })

    // Se for professor, filtrar apenas seus cursos
    if (profile.role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    }

    const { data: courses, error } = await query

    if (error) {
      console.error('Erro ao buscar cursos:', error)
      return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 })
    }

    return NextResponse.json({ courses: courses || [] })
  } catch (error) {
    console.error('Erro na API de cursos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}