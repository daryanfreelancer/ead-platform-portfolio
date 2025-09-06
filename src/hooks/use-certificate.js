'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { certificateGenerator } from '@/lib/certificates/generator'
import { formatCPF } from '@/lib/utils'

const supabase = createClient()

export function useCertificate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Gera e salva certificado no banco
   */
  const generateCertificate = async (enrollmentId) => {
    setLoading(true)
    setError(null)

    try {
      // Buscar dados do enrollment com informações do curso e usuário
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            duration,
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
        .single()

      if (enrollmentError) throw enrollmentError

      if (!enrollment.completed_at) {
        throw new Error('Curso não foi concluído ainda')
      }

      // Verificar se certificado já existe
      const { data: existingCert } = await supabase
        .from('legacy_certificates')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .single()

      let certificateId = existingCert?.id || `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Verificar se os dados necessários estão presentes
      if (!enrollment.student?.full_name) {
        throw new Error('Dados do perfil incompletos. Complete seu nome completo no perfil antes de gerar o certificado.')
      }

      // Dados para o certificado
      const certificateData = {
        studentName: enrollment.student.full_name,
        studentCpf: formatCPF(enrollment.student.cpf),
        courseName: enrollment.courses.title,
        teacherName: enrollment.courses.teacher?.full_name || 'Instituto EduPlatform',
        completionDate: new Date(enrollment.completed_at).toLocaleDateString('pt-BR'),
        certificateId: certificateId,
        courseHours: Math.floor(enrollment.courses.duration / 60) || 1
      }

      // Salvar no banco de dados se não existir
      if (!existingCert) {
        const { error: saveError } = await supabase
          .from('legacy_certificates')
          .insert([{
            id: certificateId,
            enrollment_id: enrollmentId,
            student_id: enrollment.student_id,
            course_id: enrollment.course_id,
            cpf: formatCPF(enrollment.student.cpf),
            student_name: enrollment.student.full_name,
            course_name: enrollment.courses.title,
            teacher_name: enrollment.courses.teacher?.full_name || 'Instituto EduPlatform',
            completion_date: enrollment.completed_at,
            created_at: new Date().toISOString()
          }])

        if (saveError) throw saveError
      }

      // Gerar e baixar certificado em PDF
      const result = await certificateGenerator.generateAndDownloadPDF(certificateData)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar certificado PDF')
      }

      return {
        success: true,
        certificateId,
        filename: result.filename,
        format: 'pdf'
      }

    } catch (err) {
      console.error('Erro ao gerar certificado:', err)
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Busca certificados do usuário
   */
  const getUserCertificates = async (userId) => {
    setLoading(true)
    setError(null)

    try {
      const { data: certificates, error: certsError } = await supabase
        .from('legacy_certificates')
        .select(`
          *,
          courses (
            title,
            duration
          )
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false })

      if (certsError) throw certsError

      return {
        success: true,
        certificates
      }

    } catch (err) {
      console.error('Erro ao buscar certificados:', err)
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verifica se certificado existe
   */
  const verifyCertificate = async (certificateId) => {
    setLoading(true)
    setError(null)

    try {
      const { data: certificate, error: certError } = await supabase
        .from('legacy_certificates')
        .select(`
          *,
          courses (
            title,
            duration
          )
        `)
        .eq('id', certificateId)
        .single()

      if (certError) throw certError

      return {
        success: true,
        certificate,
        isValid: !!certificate
      }

    } catch (err) {
      console.error('Erro ao verificar certificado:', err)
      setError(err.message)
      return {
        success: false,
        error: err.message,
        isValid: false
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Regenera certificado existente
   */
  const regenerateCertificate = async (certificateId) => {
    setLoading(true)
    setError(null)

    try {
      // Buscar certificado existente
      const { data: certificate, error: certError } = await supabase
        .from('legacy_certificates')
        .select(`
          *,
          enrollments (
            *,
            courses (
              title,
              duration,
              profiles!teacher_id (
                full_name
              )
            )
          )
        `)
        .eq('id', certificateId)
        .single()

      if (certError) throw certError

      // Dados para regeneração
      const certificateData = {
        studentName: certificate.student_name,
        studentCpf: certificate.cpf, // CPF já formatado na tabela
        courseName: certificate.course_name,
        teacherName: certificate.teacher_name,
        completionDate: new Date(certificate.completion_date).toLocaleDateString('pt-BR'),
        certificateId: certificate.id,
        courseHours: Math.floor(certificate.enrollments.courses.duration / 60) || 1
      }

      // Gerar e baixar certificado em PDF novamente
      const result = await certificateGenerator.generateAndDownloadPDF(certificateData)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao regenerar certificado PDF')
      }

      return {
        success: true,
        certificateId: certificate.id,
        filename: result.filename,
        format: 'pdf'
      }

    } catch (err) {
      console.error('Erro ao regenerar certificado:', err)
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    generateCertificate,
    getUserCertificates,
    verifyCertificate,
    regenerateCertificate
  }
}