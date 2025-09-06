import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request) {
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

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo foi enviado' }, { status: 400 })
    }

    // Verificar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      return NextResponse.json({ error: 'Formato de arquivo inválido. Use .xlsx ou .xls' }, { status: 400 })
    }

    // Ler arquivo Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    // Validar estrutura do Excel
    const requiredFields = ['nome_curso', 'categoria']
    const sampleRow = jsonData[0]
    
    if (!sampleRow) {
      return NextResponse.json({ error: 'Arquivo Excel está vazio' }, { status: 400 })
    }

    const missingFields = requiredFields.filter(field => !(field in sampleRow))
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Campos obrigatórios não encontrados: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Validar categorias
    const validCategories = [
      'capacitacao', 'tecnologo', 'bacharel', 'licenciatura',
      'tecnico_competencia', 'tecnico', 'mestrado', 'doutorado', 'pos_doutorado'
    ]

    // Filtrar linhas vazias e validar dados
    const validRows = []
    const errors = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNum = i + 2 // Excel começa na linha 2 (linha 1 é header)

      // Pular linhas vazias
      if (!row.nome_curso || row.nome_curso.toString().trim() === '') {
        continue
      }

      // Validar categoria
      if (!row.categoria || !validCategories.includes(row.categoria)) {
        errors.push(`Linha ${rowNum}: Categoria inválida: "${row.categoria}"`)
        continue
      }

      validRows.push({
        nome_curso: row.nome_curso.toString().trim(),
        categoria: row.categoria,
        subcategoria: row.subcategoria ? row.subcategoria.toString().trim() : null,
        is_active: true
      })
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Erros encontrados no arquivo:',
        details: errors
      }, { status: 400 })
    }

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'Nenhum curso válido encontrado no arquivo' }, { status: 400 })
    }

    // Verificar duplicatas por nome do curso
    const existingCourses = await supabase
      .from('course_catalog')
      .select('nome_curso')

    const existingNames = new Set(existingCourses.data?.map(c => c.nome_curso.toLowerCase()) || [])
    
    const uniqueRows = validRows.filter(row => {
      return !existingNames.has(row.nome_curso.toLowerCase())
    })

    const duplicateCount = validRows.length - uniqueRows.length

    if (uniqueRows.length === 0) {
      return NextResponse.json({
        error: 'Todos os cursos já existem no catálogo',
        duplicates: duplicateCount
      }, { status: 400 })
    }

    // Inserir cursos em lote
    const { data: insertedCourses, error: insertError } = await supabase
      .from('course_catalog')
      .insert(uniqueRows)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      message: 'Importação concluída com sucesso',
      imported: insertedCourses.length,
      duplicates: duplicateCount,
      total_processed: validRows.length,
      courses: insertedCourses
    })

  } catch (error) {
    console.error('Erro ao importar catálogo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}