import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request) {
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

    // Buscar todos os cursos do catálogo
    const { data: courses, error } = await supabase
      .from('course_catalog')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nome_curso', { ascending: true })

    if (error) throw error

    // Preparar dados para Excel com campos extras para migração futura
    const excelData = courses.map(course => ({
      nome_curso: course.nome_curso,
      categoria: course.categoria,
      subcategoria: course.subcategoria || '',
      // Campos extras para migração futura para tabela courses
      description: '', // Para preenchimento futuro
      teacher_id: '', // UUID do professor - para preenchimento futuro
      price: '', // Preço do curso - para preenchimento futuro
      hub_id: '', // UUID do polo educacional - para preenchimento futuro
      is_active: course.is_active ? 'true' : 'false',
      created_at: course.created_at,
      catalog_id: course.id // ID do catálogo para referência
    }))

    // Criar workbook do Excel
    const workbook = XLSX.utils.book_new()
    
    // Worksheet principal com dados
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Não adicionar headers customizados - usar os nomes exatos dos campos
    // Isso garante que a importação funcione corretamente
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo de Cursos')
    
    // Worksheet de instruções
    const instructionsData = [
      ['INSTRUÇÕES PARA MIGRAÇÃO FUTURA'],
      [''],
      ['Este arquivo contém o catálogo de cursos atual e campos extras para migração futura.'],
      [''],
      ['CAMPOS OBRIGATÓRIOS PARA MIGRAÇÃO:'],
      ['• nome_curso: Nome do curso (já preenchido)'],
      ['• categoria: Categoria do curso (já preenchido)'],
      ['• description: Descrição detalhada do curso (PREENCHER)'],
      ['• teacher_id: UUID do professor responsável (PREENCHER)'],
      ['• price: Valor numérico do curso (PREENCHER)'],
      ['• hub_id: UUID do polo educacional (PREENCHER)'],
      [''],
      ['CATEGORIAS VÁLIDAS:'],
      ['• capacitacao - Cursos de desenvolvimento profissional'],
      ['• tecnologo - Cursos tecnológicos de 2-3 anos'],
      ['• bacharel - Cursos de graduação de 4-5 anos'],
      ['• licenciatura - Cursos para formação de professores'],
      ['• tecnico_competencia - Reconhecimento de competências'],
      ['• tecnico - Educação técnica de nível médio'],
      ['• mestrado - Programas de pós-graduação'],
      ['• doutorado - Programas de doutorado'],
      ['• pos_doutorado - Programas de pesquisa avançada'],
      [''],
      ['CONSULTANDO IDs DISPONÍVEIS:'],
      ['• Professores: SELECT id, full_name FROM profiles WHERE role = \'teacher\''],
      ['• Polos: SELECT id, name FROM educational_hubs WHERE is_active = true']
    ]
    
    const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructionsData)
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instruções')
    
    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Retornar arquivo Excel
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `catalogo-cursos-${timestamp}.xlsx`
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Erro ao exportar catálogo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}