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

    const { certificateId, isActive } = await request.json()

    if (!certificateId) {
      return NextResponse.json({ error: 'ID do certificado é obrigatório' }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Status isActive deve ser boolean' }, { status: 400 })
    }

    // Buscar certificado atual
    const { data: certificate, error: fetchError } = await supabase
      .from('legacy_certificates')
      .select('id, is_active, nome_aluno, numero_certificado')
      .eq('id', certificateId)
      .single()

    if (fetchError || !certificate) {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })
    }

    // Atualizar status do certificado
    const { error: updateError } = await supabase
      .from('legacy_certificates')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', certificateId)

    if (updateError) {
      throw updateError
    }

    // Log de auditoria
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action: 'toggle_certificate_status',
        table_name: 'legacy_certificates',
        record_id: certificateId,
        details: {
          certificate_number: certificate.numero_certificado,
          student_name: certificate.nome_aluno,
          old_status: certificate.is_active,
          new_status: isActive
        }
      }])

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificateId,
        is_active: isActive
      }
    })

  } catch (error) {
    console.error('Erro ao alternar status do certificado:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}