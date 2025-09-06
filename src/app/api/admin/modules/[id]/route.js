import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    
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

    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    // Atualizar módulo
    const { data: updatedModule, error } = await supabase
      .from('course_modules')
      .update({
        title,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      console.error('Erro ao atualizar módulo:', error)
      return NextResponse.json({ error: 'Erro ao atualizar módulo' }, { status: 500 })
    }

    return NextResponse.json({ module: updatedModule })
  } catch (error) {
    console.error('Erro na API de atualização de módulo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    
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

    // Verificar se o módulo existe e obter informações
    const { data: module, error: moduleError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('id', id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    // Verificar se há aulas associadas
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('module_id', id)

    if (lessonsError) {
      console.error('Erro ao verificar aulas:', lessonsError)
      return NextResponse.json({ error: 'Erro ao verificar aulas' }, { status: 500 })
    }

    // Se há aulas, remover a associação com o módulo ao invés de deletar
    if (lessons && lessons.length > 0) {
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ module_id: null })
        .eq('module_id', id)

      if (updateError) {
        console.error('Erro ao desassociar aulas:', updateError)
        return NextResponse.json({ error: 'Erro ao desassociar aulas' }, { status: 500 })
      }
    }

    // Deletar módulo
    const { error: deleteError } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar módulo:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar módulo' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: lessons && lessons.length > 0 
        ? `Módulo deletado. ${lessons.length} aulas foram desassociadas.`
        : 'Módulo deletado com sucesso.'
    })
  } catch (error) {
    console.error('Erro na API de exclusão de módulo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}