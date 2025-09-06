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

    const { certificate } = await request.json()

    if (!certificate) {
      return NextResponse.json({ error: 'Dados do certificado são obrigatórios' }, { status: 400 })
    }

    // Validações dos campos obrigatórios
    if (!certificate.nome_aluno || certificate.nome_aluno.trim() === '') {
      return NextResponse.json({ error: 'Nome do aluno é obrigatório' }, { status: 400 })
    }

    if (!certificate.cpf || certificate.cpf.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido (deve ter 11 dígitos)' }, { status: 400 })
    }

    if (!certificate.numero_certificado || certificate.numero_certificado.trim() === '') {
      return NextResponse.json({ error: 'Número do certificado é obrigatório' }, { status: 400 })
    }

    if (!certificate.nome_curso || certificate.nome_curso.trim() === '') {
      return NextResponse.json({ error: 'Nome do curso é obrigatório' }, { status: 400 })
    }

    if (!certificate.carga_horaria || certificate.carga_horaria <= 0) {
      return NextResponse.json({ error: 'Carga horária deve ser maior que zero' }, { status: 400 })
    }

    if (!certificate.data_conclusao) {
      return NextResponse.json({ error: 'Data de conclusão é obrigatória' }, { status: 400 })
    }

    // Verificar se certificado já existe na nova tabela
    const { data: existingCert } = await supabase
      .from('certificados_antigos')
      .select('id')
      .eq('numero_certificado', certificate.numero_certificado)
      .single()

    if (existingCert) {
      return NextResponse.json({ 
        error: `Certificado ${certificate.numero_certificado} já existe no sistema` 
      }, { status: 409 })
    }

    // Verificar também na tabela legacy_certificates para evitar duplicação
    const { data: existingLegacy } = await supabase
      .from('legacy_certificates')
      .select('id')
      .eq('numero_certificado', certificate.numero_certificado)
      .single()

    if (existingLegacy) {
      return NextResponse.json({ 
        error: `Certificado ${certificate.numero_certificado} já existe como legado` 
      }, { status: 409 })
    }

    // Preparar dados para inserção - estrutura simplificada sem foreign keys
    const certificateToInsert = {
      id: certificate.id,
      nome_aluno: certificate.nome_aluno.trim(),
      cpf: certificate.cpf,
      numero_certificado: certificate.numero_certificado.trim(),
      nome_curso: certificate.nome_curso.trim(),
      carga_horaria: parseInt(certificate.carga_horaria),
      data_conclusao: certificate.data_conclusao,
      pdf_url: certificate.pdf_url || null,
      is_active: certificate.is_active !== false, // Default true
      created_at: certificate.created_at || new Date().toISOString(),
      updated_at: certificate.updated_at || new Date().toISOString()
    }

    // Inserir certificado na nova tabela simplificada
    const { data: newCertificate, error: insertError } = await supabase
      .from('certificados_antigos')
      .insert([certificateToInsert])
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir certificado antigo:', insertError)
      throw insertError
    }

    // Log de auditoria (não-bloqueante para evitar problemas de sessão)
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: 'create_historical_certificate',
          table_name: 'certificados_antigos',
          record_id: newCertificate.id,
          details: {
            certificate_number: certificate.numero_certificado,
            student_name: certificate.nome_aluno,
            course_name: certificate.nome_curso
          }
        }])
      console.log('Audit log criado com sucesso')
    } catch (auditError) {
      console.error('Erro no audit log (não-bloqueante):', auditError)
      // Não bloquear a resposta por erro de audit
    }

    console.log('Certificado histórico criado com sucesso:', {
      id: newCertificate.id,
      numero_certificado: certificate.numero_certificado,
      user_id: user.id
    })

    return NextResponse.json({
      success: true,
      certificate: newCertificate
    })

  } catch (error) {
    console.error('Erro ao criar certificado histórico:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}