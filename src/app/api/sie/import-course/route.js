import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é professor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Apenas professores podem importar cursos' },
        { status: 403 }
      )
    }

    const { sie_course_id, course_data } = await request.json()

    if (!sie_course_id || !course_data) {
      return NextResponse.json(
        { success: false, error: 'Dados do curso obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se curso já foi importado
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('sie_course_id', sie_course_id)
      .eq('teacher_id', user.id)
      .single()

    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Curso já importado por você' },
        { status: 409 }
      )
    }

    // Mapear categoria SIE para categoria do sistema
    const categoryMapping = {
      'Capacitação': 'capacitacao',
      'Tecnólogo': 'tecnologo',
      'Bacharel': 'bacharel',
      'Licenciatura': 'licenciatura',
      'Técnico': 'tecnico',
      'Mestrado': 'mestrado',
      'Doutorado': 'doutorado',
      'Pós-Doutorado': 'pos_doutorado'
    }

    // Aceitar dados tanto em português quanto em inglês
    const category = categoryMapping[course_data.categoria || course_data.category] || 'capacitacao'

    // Criar curso no banco - aceitar campos em ambos os idiomas
    const courseToInsert = {
      title: course_data.nome || course_data.title || 'Curso SIE',
      description: course_data.descricao || course_data.description || 'Curso importado do catálogo SIE',
      category: category,
      duration: course_data.carga_horaria || course_data.duration || 40,
      price: course_data.preco !== undefined ? course_data.preco : (course_data.price || 0),
      is_free: !(course_data.preco || course_data.price) || (course_data.preco || course_data.price) === 0,
      teacher_id: user.id,
      is_sie_course: true,
      sie_course_id: sie_course_id,
      status: 'pending',
      video_type: 'external',
      video_url: course_data.url_acesso || course_data.video_url || null
    }

    const { data: newCourse, error: insertError } = await supabase
      .from('courses')
      .insert([courseToInsert])
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir curso:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar curso no banco de dados' },
        { status: 500 }
      )
    }

    // Cache dos dados SIE
    await supabase
      .from('sie_courses_cache')
      .upsert({
        sie_course_id: sie_course_id,
        course_data: course_data,
        last_sync: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      })

    return NextResponse.json({
      success: true,
      course: newCourse,
      message: 'Curso importado com sucesso'
    })

  } catch (error) {
    console.error('Erro na importação SIE:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}