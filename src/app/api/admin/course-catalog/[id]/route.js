import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Buscar curso específico do catálogo
export async function GET(request, { params }) {
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

    const { data: course, error } = await supabase
      .from('course_catalog')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ course })

  } catch (error) {
    console.error('Erro ao buscar curso do catálogo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar curso do catálogo
export async function PUT(request, { params }) {
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
    const { nome_curso, categoria, subcategoria, is_active } = body

    // Validações
    if (nome_curso !== undefined && (!nome_curso || nome_curso.trim() === '')) {
      return NextResponse.json({ error: 'Nome do curso é obrigatório' }, { status: 400 })
    }

    if (categoria !== undefined) {
      const validCategories = [
        'capacitacao', 'tecnologo', 'bacharel', 'licenciatura',
        'tecnico_competencia', 'tecnico', 'mestrado', 'doutorado', 'pos_doutorado'
      ]

      if (!validCategories.includes(categoria)) {
        return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 })
      }
    }

    // Preparar dados para atualização
    const updateData = {}
    if (nome_curso !== undefined) updateData.nome_curso = nome_curso.trim()
    if (categoria !== undefined) updateData.categoria = categoria
    if (subcategoria !== undefined) updateData.subcategoria = subcategoria?.trim() || null
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: course, error } = await supabase
      .from('course_catalog')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ course })

  } catch (error) {
    console.error('Erro ao atualizar curso do catálogo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir curso do catálogo
export async function DELETE(request, { params }) {
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

    const { error } = await supabase
      .from('course_catalog')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ message: 'Curso excluído com sucesso' })

  } catch (error) {
    console.error('Erro ao excluir curso do catálogo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}