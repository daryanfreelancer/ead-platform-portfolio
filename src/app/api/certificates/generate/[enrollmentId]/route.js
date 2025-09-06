import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { enrollmentId } = params

    // Buscar matrícula com dados do curso e perfil
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          is_sie_course,
          teacher:profiles!teacher_id (
            full_name
          )
        ),
        student:profiles!student_id (
          full_name,
          cpf
        )
      `)
      .eq('id', enrollmentId)
      .eq('student_id', user.id)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 })
    }

    // Verificar elegibilidade para certificado
    const isEligible = await checkCertificateEligibility(enrollment, supabase)
    
    if (!isEligible.eligible) {
      return NextResponse.json({ 
        error: 'Não elegível para certificado',
        reason: isEligible.reason 
      }, { status: 400 })
    }

    // Verificar se os dados necessários estão presentes
    if (!enrollment.student?.full_name) {
      return NextResponse.json({ 
        error: 'Dados do perfil incompletos. Complete seu nome completo no perfil antes de gerar o certificado.' 
      }, { status: 400 })
    }

    // Verificar se já existe certificado para esta matrícula
    const { data: existingCert } = await supabase
      .from('legacy_certificates')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .single()

    let certificateNumber = `EduPlatform-${enrollment.id.substring(0, 8).toUpperCase()}`
    
    // Se não existe, criar novo certificado
    if (!existingCert) {
      const { data: newCert, error: certError } = await supabase
        .from('legacy_certificates')
        .insert([{
          id: certificateNumber,
          enrollment_id: enrollmentId,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          student_name: enrollment.student.full_name,
          course_name: enrollment.courses.title,
          teacher_name: enrollment.courses.teacher?.full_name || 'Instituto EduPlatform',
          completion_date: enrollment.completed_at,
          cpf: enrollment.student.cpf, // Incluir CPF para consulta pública
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (certError) {
        console.error('Error saving certificate:', certError)
        return NextResponse.json({ 
          error: 'Erro ao salvar certificado no banco de dados' 
        }, { status: 500 })
      }
    }

    // Gerar dados do certificado para resposta
    const certificateData = {
      studentName: enrollment.student.full_name,
      studentCpf: enrollment.student.cpf || 'Não informado',
      courseName: enrollment.courses.title,
      courseDescription: enrollment.courses.description,
      teacherName: enrollment.courses.teacher?.full_name || 'Instituto EduPlatform',
      completionDate: new Date(enrollment.completed_at).toLocaleDateString('pt-BR'),
      enrollmentDate: new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR'),
      certificateNumber: certificateNumber,
      issueDate: new Date().toLocaleDateString('pt-BR')
    }

    return NextResponse.json({
      success: true,
      certificateData,
      message: existingCert ? 'Certificado já existe' : 'Certificado gerado e salvo com sucesso'
    })

  } catch (error) {
    console.error('Erro ao gerar certificado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function checkCertificateEligibility(enrollment, supabase) {
  try {
    // Se não foi concluído, não é elegível
    if (!enrollment.completed_at) {
      return { eligible: false, reason: 'Curso não concluído' }
    }

    // Para cursos SIE, aplicar lógica especial
    if (enrollment.courses.is_sie_course) {
      // Integrar com verificação da API SIE se dados estão disponíveis
      if (enrollment.sie_user_id && enrollment.sie_user_token && enrollment.courses.sie_course_id) {
        try {
          const { checkSieCertificateEligibility } = await import('@/lib/sie-api/evaluations')
          const eligibility = await checkSieCertificateEligibility(
            enrollment.sie_user_id,
            enrollment.sie_user_token,
            enrollment.courses.sie_course_id
          )
          
          return eligibility.eligible 
            ? { eligible: true, reason: eligibility.reason }
            : { eligible: false, reason: `SIE: ${eligibility.reason}` }
            
        } catch (error) {
          console.error('Erro ao verificar elegibilidade SIE:', error)
          // Fallback para dados locais
          return { eligible: true, reason: 'Curso SIE concluído (fallback local)' }
        }
      }
      
      // Se não há dados SIE, usar dados locais
      return { eligible: true, reason: 'Curso SIE concluído (dados locais)' }
    }

    // Para cursos locais, verificar avaliações
    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('course_id', enrollment.courses.id)
      .eq('is_active', true)

    if (error) throw error

    // Se não há avaliações, certificado pode ser emitido
    if (!evaluations || evaluations.length === 0) {
      return { eligible: true, reason: 'Curso concluído sem avaliações' }
    }

    // Verificar se todas as avaliações foram aprovadas
    const { data: attempts, error: attemptError } = await supabase
      .from('evaluation_attempts')
      .select('*')
      .eq('student_id', enrollment.student_id)
      .in('evaluation_id', evaluations.map(e => e.id))

    if (attemptError) throw attemptError

    const attemptsMap = {}
    attempts?.forEach(attempt => {
      if (!attemptsMap[attempt.evaluation_id]) {
        attemptsMap[attempt.evaluation_id] = []
      }
      attemptsMap[attempt.evaluation_id].push(attempt)
    })

    // Verificar se todas as avaliações foram aprovadas
    const allApproved = evaluations.every(evaluation => {
      const evaluationAttempts = attemptsMap[evaluation.id] || []
      const bestAttempt = evaluationAttempts.reduce((best, current) => {
        return !best || current.score > best.score ? current : best
      }, null)

      return bestAttempt && bestAttempt.score >= evaluation.passing_score
    })

    if (allApproved) {
      return { eligible: true, reason: 'Curso e avaliações concluídas' }
    } else {
      return { eligible: false, reason: 'Avaliações pendentes ou reprovadas' }
    }

  } catch (error) {
    console.error('Erro ao verificar elegibilidade:', error)
    return { eligible: false, reason: 'Erro ao verificar elegibilidade' }
  }
}