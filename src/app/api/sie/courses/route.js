import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sieApiClient } from '@/lib/sie-api/client'

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Verificar se usuário está autenticado
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

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se a API SIE está habilitada
    const { data: config } = await supabase
      .from('sie_api_config')
      .select('sync_enabled')
      .single()

    if (!config?.sync_enabled) {
      return NextResponse.json({ 
        error: 'API SIE está pausada. Contate o administrador.' 
      }, { status: 503 })
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const requestedLimit = parseInt(searchParams.get('limit')) || 100
    const page = parseInt(searchParams.get('page')) || 1
    const category = searchParams.get('category') || ''

    // Limitar results ao máximo da API SIE (100)
    const limit = Math.min(requestedLimit, 100)

    // Buscar cursos na API SIE com paginação real
    const response = await sieApiClient.getCourses({
      results: limit, // API SIE usa 'results' não 'limit'
      page,
      category_id: category ? parseInt(category) : undefined,
      query: search || undefined, // API SIE suporta busca por título
      order: 'title', // Ordenar por título
      all_formats: true // Incluir todos os formatos
    })

    // Transformar dados para formato padronizado
    const courses = response.COURSES ? response.COURSES.map(course => ({
      id: course.course_id || course.id,
      title: course.course_title || course.title || course.name,
      description: course.course_description || course.description || course.course_summary || course.summary,
      duration: course.course_hours ? course.course_hours * 60 : (course.duration || 0),
      teacher: course.course_teacher?.teacher_name || course.teacher_name || course.teacher || 'Professor SIE',
      thumbnail: course.course_image || course.image || course.thumbnail || null,
      topics: course.course_topics || course.topics || [],
      price: course.course_price || course.price || 0,
      rating: course.course_rating || course.rating || 0,
      students: course.course_students || course.students || 0,
      category: course.course_category || course.category || '',
      // Dados específicos SIE
      sie_course_id: course.course_id || course.id,
      sie_data: course // Manter dados originais para referência
    })) : []

    // Extrair informações de paginação da resposta SIE
    const totalPages = response.TOTAL_PAGES || 1
    const currentPage = response.CURRENT_PAGE || page
    const totalCourses = response.TOTAL_RESULTS || null

    return NextResponse.json({
      success: true,
      courses,
      total: totalCourses,
      page: currentPage,
      limit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    })

  } catch (error) {
    console.error('Erro na API SIE:', error)
    return NextResponse.json({ 
      error: 'Erro ao buscar cursos SIE',
      details: error.message 
    }, { status: 500 })
  }
}