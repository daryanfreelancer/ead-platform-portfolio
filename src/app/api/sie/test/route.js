import { NextResponse } from 'next/server'
import { sieApiClient } from '@/lib/sie-api/client'

export async function GET(request) {
  try {
    console.log('🧪 Teste da API SIE iniciado')
    
    // Teste 1: Verificar se o token está configurado
    if (!process.env.SIE_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Token SIE não configurado',
        details: 'Configure SIE_API_TOKEN nas variáveis de ambiente'
      }, { status: 500 })
    }
    
    console.log('✅ Token SIE configurado')
    
    // Teste 2: Tentar buscar categorias (endpoint simples)
    console.log('🔍 Testando busca de categorias...')
    const categoriesResponse = await sieApiClient.getCategories()
    
    console.log('✅ Categorias obtidas:', categoriesResponse.CATEGORIES?.length || 0)
    
    // Teste 3: Tentar buscar cursos SEM usuário SIE
    console.log('🔍 Testando busca de cursos SEM usuário SIE...')
    const coursesResponse = await sieApiClient.getCourses({ limit: 5 })
    
    console.log('✅ Cursos obtidos SEM usuário:', coursesResponse.COURSES?.length || 0)
    
    // Teste 4: Verificar se funciona apenas com token da API
    console.log('🔍 Testando acesso apenas com token da API...')
    const publicAccessTest = await sieApiClient.makeRequest('/api/course/get-courses', {
      results: 5,
      page: 1
      // Sem user_id e user_token
    })
    
    console.log('✅ Acesso público funcionou:', !!publicAccessTest.COURSES)
    
    return NextResponse.json({
      success: true,
      message: 'API SIE está funcionando',
      data: {
        token_configured: true,
        categories_count: categoriesResponse.CATEGORIES?.length || 0,
        courses_count: coursesResponse.COURSES?.length || 0,
        public_access_works: !!publicAccessTest.COURSES,
        sample_course: coursesResponse.COURSES?.[0] || null,
        sample_public_course: publicAccessTest.COURSES?.[0] || null
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no teste SIE:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack,
      token_configured: !!process.env.SIE_API_TOKEN
    }, { status: 500 })
  }
}