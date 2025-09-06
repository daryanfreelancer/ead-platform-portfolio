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

    // Validações
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

    // Verificar se certificado já existe
    const { data: existingCert } = await supabase
      .from('legacy_certificates')
      .select('id')
      .eq('numero_certificado', certificate.numero_certificado)
      .single()

    if (existingCert) {
      return NextResponse.json({ 
        error: `Certificado ${certificate.numero_certificado} já existe no sistema` 
      }, { status: 409 })
    }

    // Buscar um admin existente para usar como referência
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminProfile) {
      return NextResponse.json({ error: 'Erro interno: admin não encontrado' }, { status: 500 })
    }

    // Buscar um curso existente para usar como referência
    const { data: defaultCourse } = await supabase
      .from('courses')
      .select('id')
      .limit(1)
      .single()

    if (!defaultCourse) {
      return NextResponse.json({ error: 'Erro interno: curso não encontrado' }, { status: 500 })
    }

    // Preparar dados com campos obrigatórios usando referências válidas
    const certificateToInsert = {
      id: certificate.id,
      student_id: adminProfile.id, // Usar admin como referência
      course_id: defaultCourse.id, // Usar curso existente como referência
      nome_aluno: certificate.nome_aluno,
      cpf: certificate.cpf,
      numero_certificado: certificate.numero_certificado,
      nome_curso: certificate.nome_curso,
      carga_horaria: certificate.carga_horaria,
      data_conclusao: certificate.data_conclusao,
      pdf_url: certificate.pdf_url,
      is_active: certificate.is_active,
      created_at: certificate.created_at,
      updated_at: certificate.updated_at
    }

    // Inserir certificado
    const { data: newCertificate, error: insertError } = await supabase
      .from('legacy_certificates')
      .insert([certificateToInsert])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Log de auditoria
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action: 'create_legacy_certificate',
        table_name: 'legacy_certificates',
        record_id: newCertificate.id,
        details: {
          certificate_number: certificate.numero_certificado,
          student_name: certificate.nome_aluno,
          course_name: certificate.nome_curso
        }
      }])

    return NextResponse.json({
      success: true,
      certificate: newCertificate
    })

  } catch (error) {
    console.error('Erro ao criar certificado legado:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}