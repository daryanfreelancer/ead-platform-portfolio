import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { lessonId, isActive, reason } = await request.json()

    if (!lessonId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar estado atual da aula
    const { data: currentLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('is_active, title, course_id')
      .eq('id', lessonId)
      .single()

    if (fetchError || !currentLesson) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }

    // Verificar se já está no estado desejado
    if (currentLesson.is_active === isActive) {
      return NextResponse.json({ 
        message: `Aula já está ${isActive ? 'ativada' : 'desativada'}` 
      })
    }

    // Usar função do banco para atualizar aula
    const { error: toggleError } = await supabase
      .rpc('toggle_lesson_activation', {
        lesson_id: lessonId,
        is_active: isActive
      })

    if (toggleError) {
      console.error('Erro ao alterar ativação da aula:', toggleError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Registrar no log de auditoria
    const { error: logError } = await supabase
      .rpc('log_activation_change', {
        p_admin_id: user.id,
        p_entity_type: 'lesson',
        p_entity_id: lessonId,
        p_action: isActive ? 'activate' : 'deactivate',
        p_previous_state: currentLesson.is_active,
        p_new_state: isActive,
        p_reason: reason || null
      })

    if (logError) {
      console.error('Erro ao registrar no log de auditoria:', logError)
      // Não falhar a operação por erro de log
    }

    return NextResponse.json({
      message: `Aula "${currentLesson.title}" ${isActive ? 'ativada' : 'desativada'} com sucesso`,
      lessonId,
      isActive,
      previousState: currentLesson.is_active,
      courseId: currentLesson.course_id
    })

  } catch (error) {
    console.error('Erro na API toggle-lesson-activation:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}