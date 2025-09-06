import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parâmetros de filtro
    const categoria = searchParams.get('categoria')
    const subcategoria = searchParams.get('subcategoria')
    const ativo = searchParams.get('ativo')
    const busca = searchParams.get('busca')

    // Construir query
    let query = supabase
      .from('course_catalog')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nome_curso', { ascending: true })

    // Aplicar filtros
    if (categoria && categoria !== 'all') {
      query = query.eq('categoria', categoria)
    }

    if (subcategoria && subcategoria !== 'all') {
      query = query.eq('subcategoria', subcategoria)
    }

    if (ativo === 'true') {
      query = query.eq('is_active', true)
    } else if (ativo === 'false') {
      query = query.eq('is_active', false)
    }

    if (busca) {
      query = query.or(
        `nome_curso.ilike.%${busca}%,subcategoria.ilike.%${busca}%`
      )
    }

    const { data: courses, error } = await query

    if (error) throw error

    return NextResponse.json({
      courses: courses || [],
      total: courses?.length || 0
    })

  } catch (error) {
    console.error('Erro ao buscar catálogo de cursos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}