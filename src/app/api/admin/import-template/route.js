import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// GET - Download template vazio para importação
export async function GET(request) {
  try {
    // Criar dados de exemplo para o template
    const templateData = [
      {
        nome_curso: 'Exemplo: Pedagogia',
        categoria: 'licenciatura',
        subcategoria: 'Educação Infantil'
      },
      {
        nome_curso: 'Exemplo: Administração',
        categoria: 'bacharel',
        subcategoria: 'Gestão Empresarial'
      },
      {
        nome_curso: 'Exemplo: Marketing Digital',
        categoria: 'capacitacao',
        subcategoria: 'Marketing Online'
      }
    ]

    // Criar workbook do Excel
    const workbook = XLSX.utils.book_new()
    
    // Worksheet principal com dados de exemplo
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    
    // Worksheet de instruções
    const instructionsData = [
      ['INSTRUÇÕES PARA IMPORTAÇÃO'],
      [''],
      ['CAMPOS OBRIGATÓRIOS:'],
      ['• nome_curso: Nome do curso (texto)'],
      ['• categoria: Uma das categorias válidas listadas abaixo'],
      [''],
      ['CAMPO OPCIONAL:'],
      ['• subcategoria: Subcategoria do curso (texto livre)'],
      [''],
      ['CATEGORIAS VÁLIDAS (use exatamente como mostrado):'],
      ['• capacitacao - Cursos de capacitação profissional'],
      ['• tecnologo - Cursos tecnológicos'],
      ['• bacharel - Cursos de bacharelado'],
      ['• licenciatura - Cursos de licenciatura'],
      ['• tecnico_competencia - Técnico por competência'],
      ['• tecnico - Cursos técnicos'],
      ['• mestrado - Cursos de mestrado'],
      ['• doutorado - Cursos de doutorado'],
      ['• pos_doutorado - Pós-doutorado'],
      [''],
      ['IMPORTANTE:'],
      ['• Use os nomes dos campos EXATAMENTE como mostrado (minúsculo, com underscore)'],
      ['• nome_curso (NÃO use "Nome do Curso" ou variações)'],
      ['• categoria (NÃO use "Categoria" com maiúscula)'],
      ['• subcategoria (NÃO use "Subcategoria" com maiúscula)'],
      ['• Remova os exemplos antes de importar'],
      ['• Linhas vazias serão ignoradas'],
      ['• Cursos duplicados serão ignorados']
    ]
    
    const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructionsData)
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instruções')
    
    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // Retornar arquivo Excel
    const filename = 'template-importacao-cursos.xlsx'
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar template:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar template' },
      { status: 500 }
    )
  }
}