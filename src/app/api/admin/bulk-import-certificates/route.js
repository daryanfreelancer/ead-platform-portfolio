import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
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
      return NextResponse.json({ error: 'Acesso negado - apenas administradores' }, { status: 403 })
    }

    const { certificates } = await request.json()

    if (!certificates || !Array.isArray(certificates)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    if (certificates.length === 0) {
      return NextResponse.json({ error: 'Nenhum certificado para importar' }, { status: 400 })
    }

    // Validar cada certificado
    const validatedCertificates = []
    const errors = []

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i]
      const rowNum = i + 2 // +2 porque começa da linha 2 no Excel (linha 1 é cabeçalho)

      try {
        // Validações obrigatórias
        if (!cert.nome_aluno || cert.nome_aluno.trim() === '') {
          throw new Error(`Linha ${rowNum}: Nome do aluno é obrigatório`)
        }

        if (!cert.cpf || cert.cpf.length !== 11) {
          throw new Error(`Linha ${rowNum}: CPF inválido (deve ter 11 dígitos)`)
        }

        if (!cert.numero_certificado || cert.numero_certificado.trim() === '') {
          throw new Error(`Linha ${rowNum}: Número do certificado é obrigatório`)
        }

        if (!cert.nome_curso || cert.nome_curso.trim() === '') {
          throw new Error(`Linha ${rowNum}: Nome do curso é obrigatório`)
        }

        if (!cert.carga_horaria || cert.carga_horaria <= 0) {
          throw new Error(`Linha ${rowNum}: Carga horária deve ser maior que zero`)
        }

        if (!cert.data_conclusao) {
          throw new Error(`Linha ${rowNum}: Data de conclusão é obrigatória`)
        }

        // Verificar se certificado já existe
        const { data: existingCert } = await supabase
          .from('certificados_antigos')
          .select('id')
          .eq('numero_certificado', cert.numero_certificado)
          .single()

        if (existingCert) {
          throw new Error(`Linha ${rowNum}: Certificado ${cert.numero_certificado} já existe`)
        }

        // Certificado válido
        validatedCertificates.push({
          id: cert.id,
          nome_aluno: cert.nome_aluno.trim(),
          cpf: cert.cpf,
          numero_certificado: cert.numero_certificado.trim(),
          nome_curso: cert.nome_curso.trim(),
          carga_horaria: parseInt(cert.carga_horaria),
          data_conclusao: cert.data_conclusao,
          pdf_url: cert.pdf_url || null,
          created_at: cert.created_at,
          updated_at: cert.updated_at
        })

      } catch (validationError) {
        errors.push(validationError.message)
      }
    }

    // Se há certificados válidos, fazer a inserção
    let importedCount = 0
    if (validatedCertificates.length > 0) {
      // Inserir em lotes de 100 para evitar timeout
      const batchSize = 100
      for (let i = 0; i < validatedCertificates.length; i += batchSize) {
        const batch = validatedCertificates.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('certificados_antigos')
          .insert(batch)

        if (insertError) {
          throw new Error(`Erro ao inserir lote ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
        }

        importedCount += batch.length
      }
    }

    // Log de auditoria
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action: 'bulk_import_certificates',
        table_name: 'certificados_antigos',
        details: {
          imported_count: importedCount,
          total_processed: certificates.length,
          errors_count: errors.length
        }
      }])

    return NextResponse.json({
      success: true,
      imported: importedCount,
      errors: errors,
      total: certificates.length
    })

  } catch (error) {
    console.error('Erro na importação em lote:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}