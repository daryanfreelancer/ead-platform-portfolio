'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkSieCertificateEligibility } from '@/lib/sie-api/evaluations'

const supabase = createClient()

export function useCertificateEligibility(course, enrollment, user) {
  const [isEligible, setIsEligible] = useState(false)
  const [evaluations, setEvaluations] = useState([])
  const [evaluationAttempts, setEvaluationAttempts] = useState({})
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (course && enrollment && user) {
      checkCertificateEligibility()
    }
  }, [course?.id, enrollment?.id, user?.id])

  const checkCertificateEligibility = async () => {
    try {
      setLoading(true)

      // Se o curso não foi concluído, não é elegível
      if (!enrollment.completed_at) {
        setIsEligible(false)
        setReason('Curso não concluído')
        return
      }

      // Para cursos SIE, verificar se é SIE e aplicar lógica especial
      if (course.is_sie_course) {
        await checkSieCertificateEligibility()
        return
      }

      // Para cursos locais, verificar se há avaliações obrigatórias
      const { data: courseEvaluations, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('course_id', course.id)
        .eq('is_active', true)

      if (evalError) throw evalError

      setEvaluations(courseEvaluations || [])

      // Se não há avaliações, certificado pode ser emitido apenas com conclusão do curso
      if (!courseEvaluations || courseEvaluations.length === 0) {
        setIsEligible(true)
        setReason('Curso concluído')
        return
      }

      // Se há avaliações, verificar se todas foram aprovadas
      const { data: attempts, error: attemptError } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .eq('student_id', user.id)
        .in('evaluation_id', courseEvaluations.map(e => e.id))

      if (attemptError) throw attemptError

      const attemptsMap = {}
      attempts?.forEach(attempt => {
        if (!attemptsMap[attempt.evaluation_id]) {
          attemptsMap[attempt.evaluation_id] = []
        }
        attemptsMap[attempt.evaluation_id].push(attempt)
      })

      setEvaluationAttempts(attemptsMap)

      // Verificar se todas as avaliações foram aprovadas
      const allEvaluationsApproved = courseEvaluations.every(evaluation => {
        const evaluationAttempts = attemptsMap[evaluation.id] || []
        const bestAttempt = evaluationAttempts.reduce((best, current) => {
          return !best || current.score > best.score ? current : best
        }, null)

        return bestAttempt && bestAttempt.score >= evaluation.passing_score
      })

      if (allEvaluationsApproved) {
        setIsEligible(true)
        setReason('Curso e avaliações concluídas')
      } else {
        setIsEligible(false)
        setReason('Avaliações pendentes ou não aprovadas')
      }

    } catch (error) {
      console.error('Erro ao verificar elegibilidade do certificado:', error)
      setIsEligible(false)
      setReason('Erro ao verificar elegibilidade')
    } finally {
      setLoading(false)
    }
  }

  const checkSieCertificateEligibility = async () => {
    try {
      // Para cursos SIE, primeiro verificar se há dados SIE no enrollment
      if (!course.sie_course_id || !enrollment.sie_user_id || !enrollment.sie_user_token) {
        // Se não há dados SIE, usar lógica local simples
        setIsEligible(true)
        setReason('Curso SIE concluído (dados locais)')
        return
      }

      // Verificar elegibilidade via API SIE
      const eligibility = await checkSieCertificateEligibility(
        enrollment.sie_user_id,
        enrollment.sie_user_token,
        course.sie_course_id
      )

      if (eligibility.eligible) {
        setIsEligible(true)
        setReason(eligibility.reason)
      } else {
        setIsEligible(false)
        setReason(`SIE: ${eligibility.reason}`)
      }
      
    } catch (error) {
      console.error('Erro ao verificar elegibilidade do certificado SIE:', error)
      // Em caso de erro na API SIE, usar dados locais como fallback
      setIsEligible(true)
      setReason('Curso SIE concluído (fallback local)')
    }
  }

  const getFailedEvaluations = () => {
    return evaluations.filter(evaluation => {
      const attempts = evaluationAttempts[evaluation.id] || []
      const bestAttempt = attempts.reduce((best, current) => {
        return !best || current.score > best.score ? current : best
      }, null)

      return !bestAttempt || bestAttempt.score < evaluation.passing_score
    })
  }

  const getPendingEvaluations = () => {
    return evaluations.filter(evaluation => {
      const attempts = evaluationAttempts[evaluation.id] || []
      return attempts.length === 0
    })
  }

  return {
    isEligible,
    loading,
    reason,
    evaluations,
    evaluationAttempts,
    failedEvaluations: getFailedEvaluations(),
    pendingEvaluations: getPendingEvaluations(),
    refresh: checkCertificateEligibility
  }
}