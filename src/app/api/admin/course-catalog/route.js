import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Listar cursos do catálogo
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticação de admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Parâmetros de busca
    const categoria = searchParams.get('categoria')
    const subcategoria = searchParams.get('subcategoria')
    const ativo = searchParams.get('ativo')
    const busca = searchParams.get('busca')

    let query = supabase
      .from('course_catalog')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (categoria && categoria !== 'all') {
      query = query.eq('categoria', categoria)
    }

    if (subcategoria) {
      query = query.eq('subcategoria', subcategoria)
    }

    if (ativo !== null && ativo !== '') {
      query = query.eq('is_active', ativo === 'true')
    }

    if (busca) {
      query = query.ilike('nome_curso', `%${busca}%`)
    }

    const { data: courses, error } = await query

    if (error) throw error

    return NextResponse.json({ courses })

  } catch (error) {
    console.error('Erro ao buscar catálogo de cursos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo curso no catálogo
export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação de admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { nome_curso, categoria, subcategoria, is_active = true } = body

    // Validações
    if (!nome_curso || nome_curso.trim() === '') {
      return NextResponse.json({ error: 'Nome do curso é obrigatório' }, { status: 400 })
    }

    if (!categoria) {
      return NextResponse.json({ error: 'Categoria é obrigatória' }, { status: 400 })
    }

    const validCategories = [
      'capacitacao', 'tecnologo', 'bacharel', 'licenciatura',
      'tecnico_competencia', 'tecnico', 'mestrado', 'doutorado', 'pos_doutorado'
    ]

    if (!validCategories.includes(categoria)) {
      return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 })
    }

    // Inserir curso
    const { data: course, error } = await supabase
      .from('course_catalog')
      .insert({
        nome_curso: nome_curso.trim(),
        categoria,
        subcategoria: subcategoria?.trim() || null,
        is_active
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ course }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar curso no catálogo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}