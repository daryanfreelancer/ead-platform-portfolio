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

    const { courseId, isActive, reason } = await request.json()
    console.log('API Toggle Course: Recebido courseId:', courseId, 'isActive:', isActive, 'reason:', reason) // NOVO LOG

    if (!courseId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar estado atual do curso
    const { data: currentCourse, error: fetchError } = await supabase
      .from('courses')
      .select('is_active, title')
      .eq('id', courseId)
      .single()

    console.log('API Toggle Course: Resultado da busca do curso:', currentCourse, 'Erro:', fetchError) // NOVO LOG

    if (fetchError || !currentCourse) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    // Verificar se já está no estado desejado
    if (currentCourse.is_active === isActive) {
      return NextResponse.json({ 
        message: `Curso já está ${isActive ? 'ativado' : 'desativado'}` 
      })
    }

    // Usar função do banco para atualizar curso e aulas
    const { error: toggleError } = await supabase
      .rpc('toggle_course_activation', {
        course_id: courseId,
        is_active: isActive
      })

    if (toggleError) {
      console.error('Erro ao alterar ativação do curso:', toggleError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Registrar no log de auditoria
    const { error: logError } = await supabase
      .rpc('log_activation_change', {
        p_admin_id: user.id,
        p_entity_type: 'course',
        p_entity_id: courseId,
        p_action: isActive ? 'activate' : 'deactivate',
        p_previous_state: currentCourse.is_active,
        p_new_state: isActive,
        p_reason: reason || null
      })

    if (logError) {
      console.error('Erro ao registrar no log de auditoria:', logError)
      // Não falhar a operação por erro de log
    }

    return NextResponse.json({
      message: `Curso "${currentCourse.title}" ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      courseId,
      isActive,
      previousState: currentCourse.is_active
    })

  } catch (error) {
    console.error('Erro na API toggle-course-activation:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}