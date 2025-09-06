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

    const { lessonId, moduleId } = await request.json()

    if (!lessonId) {
      return NextResponse.json({ error: 'ID da aula é obrigatório' }, { status: 400 })
    }

    // Verificar se a aula existe
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }

    // Se moduleId foi fornecido, verificar se o módulo existe e pertence ao mesmo curso
    if (moduleId) {
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .eq('id', moduleId)
        .single()

      if (moduleError || !module) {
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
      }

      if (module.course_id !== lesson.course_id) {
        return NextResponse.json({ error: 'Módulo não pertence ao mesmo curso da aula' }, { status: 400 })
      }
    }

    // Atualizar a aula para associar/desassociar do módulo
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ 
        module_id: moduleId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)

    if (updateError) {
      console.error('Erro ao associar aula ao módulo:', updateError)
      return NextResponse.json({ error: 'Erro ao associar aula ao módulo' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: moduleId 
        ? 'Aula associada ao módulo com sucesso'
        : 'Aula desassociada do módulo com sucesso'
    })
  } catch (error) {
    console.error('Erro na API de associação de aula:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}