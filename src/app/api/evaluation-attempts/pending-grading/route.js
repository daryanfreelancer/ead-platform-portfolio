import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é professor ou admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar tentativas aguardando correção
    let query = supabase
      .from('evaluation_attempts')
      .select(`
        id,
        submitted_at,
        status,
        student:profiles!evaluation_attempts_student_id_fkey (
          id,
          full_name,
          email
        ),
        evaluation:evaluations (
          id,
          title,
          course:courses (
            id,
            title,
            teacher_id
          )
        )
      `)
      .eq('status', 'awaiting_grading')
      .order('submitted_at', { ascending: true })

    // Se for professor, filtrar apenas cursos que ele ensina
    if (profile.role === 'teacher') {
      query = query.eq('evaluation.course.teacher_id', user.id)
    }

    const { data: attempts, error } = await query

    if (error) {
      console.error('Erro ao buscar tentativas pendentes:', error)
      return NextResponse.json({ error: 'Erro ao buscar tentativas' }, { status: 500 })
    }

    // Filtrar tentativas válidas (com course e evaluation válidos)
    const validAttempts = (attempts || []).filter(attempt => 
      attempt.evaluation && attempt.evaluation.course && attempt.student
    )

    return NextResponse.json({ attempts: validAttempts })
  } catch (error) {
    console.error('Erro na API de tentativas pendentes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}