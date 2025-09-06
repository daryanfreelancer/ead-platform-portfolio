'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EvaluationQuestions as StudentEvaluationQuestions } from './evaluation-questions'
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Play,
  Award,
  RotateCcw
} from 'lucide-react'

const supabase = createClient()

export function EvaluationInterface({ course, enrollment, user }) {
  const [evaluations, setEvaluations] = useState([])
  const [evaluationAttempts, setEvaluationAttempts] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)
  const [showQuestions, setShowQuestions] = useState(false)

  useEffect(() => {
    loadEvaluations()
    loadEvaluationAttempts()
  }, [course.id, user.id])

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('course_id', course.id)
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    }
  }

  const loadEvaluationAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_attempts')
        .select('*')
        .eq('student_id', user.id)
        .in('evaluation_id', evaluations.map(e => e.id))

      if (error) throw error
      
      const attemptsMap = {}
      data?.forEach(attempt => {
        if (!attemptsMap[attempt.evaluation_id]) {
          attemptsMap[attempt.evaluation_id] = []
        }
        attemptsMap[attempt.evaluation_id].push(attempt)
      })
      
      setEvaluationAttempts(attemptsMap)
    } catch (error) {
      console.error('Erro ao carregar tentativas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEvaluationStatus = (evaluation) => {
    const attempts = evaluationAttempts[evaluation.id] || []
    const lastAttempt = attempts[attempts.length - 1]
    
    if (!lastAttempt) return 'pending'
    
    // Verificar se está aguardando correção
    if (lastAttempt.status === 'awaiting_grading') return 'awaiting_grading'
    
    // Verificar se passou (só se já foi corrigido)
    if (lastAttempt.passed === true) return 'passed'
    if (lastAttempt.passed === false && attempts.length >= evaluation.max_attempts) return 'failed'
    if (lastAttempt.passed === false) return 'retry'
    
    return 'pending'
  }

  const canTakeEvaluation = (evaluation) => {
    const attempts = evaluationAttempts[evaluation.id] || []
    const status = getEvaluationStatus(evaluation)
    
    return status === 'pending' || (status === 'retry' && attempts.length < evaluation.max_attempts)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />
      case 'retry': return <RotateCcw className="w-5 h-5 text-yellow-600" />
      case 'awaiting_grading': return <Clock className="w-5 h-5 text-yellow-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status, evaluation) => {
    const attempts = evaluationAttempts[evaluation.id] || []
    const lastAttempt = attempts[attempts.length - 1]
    
    switch (status) {
      case 'passed': 
        return `Aprovado (${lastAttempt?.total_score || 0}%)`
      case 'failed': 
        return `Reprovado (${attempts.length}/${evaluation.max_attempts} tentativas)`
      case 'retry': 
        return `Tentar novamente (${attempts.length}/${evaluation.max_attempts} tentativas)`
      case 'awaiting_grading':
        return 'Aguardando correção'
      default: 
        return 'Não iniciado'
    }
  }

  const handleStartEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation)
    setShowQuestions(true)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando avaliações...</span>
        </div>
      </Card>
    )
  }

  if (evaluations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma Avaliação Disponível
        </h3>
        <p className="text-gray-600">
          Este curso não possui avaliações obrigatórias.
        </p>
      </Card>
    )
  }

  if (showQuestions && selectedEvaluation) {
    return (
      <StudentEvaluationQuestions 
        evaluation={selectedEvaluation}
        user={user}
        onComplete={() => {
          setShowQuestions(false)
          setSelectedEvaluation(null)
          loadEvaluationAttempts()
        }}
        onCancel={() => {
          setShowQuestions(false)
          setSelectedEvaluation(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Avaliações do Curso
        </h2>
      </div>

      {evaluations.map((evaluation) => {
        const status = getEvaluationStatus(evaluation)
        const attempts = evaluationAttempts[evaluation.id] || []
        const lastAttempt = attempts[attempts.length - 1]

        return (
          <Card key={evaluation.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(status)}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {evaluation.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-4">{evaluation.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {evaluation.time_limit ? `${evaluation.time_limit} min` : 'Sem limite'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>{evaluation.max_attempts} tentativa(s)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Nota mínima: {evaluation.passing_score}%</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`
                      ${status === 'passed' ? 'text-green-600' : ''}
                      ${status === 'failed' ? 'text-red-600' : ''}
                      ${status === 'retry' ? 'text-yellow-600' : ''}
                      ${status === 'pending' ? 'text-gray-600' : ''}
                    `}>
                      {getStatusText(status, evaluation)}
                    </span>
                  </div>
                  
                  {lastAttempt && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span>Última tentativa: </span>
                      <span>{new Date(lastAttempt.completed_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-6 flex flex-col gap-2">
                {canTakeEvaluation(evaluation) && (
                  <Button
                    onClick={() => handleStartEvaluation(evaluation)}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {status === 'retry' ? 'Tentar Novamente' : 'Iniciar Avaliação'}
                  </Button>
                )}
                
                {status === 'passed' && (
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                    <span className="text-sm text-green-600 font-medium">Aprovado</span>
                  </div>
                )}
                
                {status === 'failed' && (
                  <div className="text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                    <span className="text-sm text-red-600 font-medium">Reprovado</span>
                  </div>
                )}
              </div>
            </div>

            {evaluation.instructions && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Instruções:</h4>
                    <p className="text-blue-800 text-sm whitespace-pre-line">
                      {evaluation.instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// Componente para exibir e responder questões da avaliação
function EvaluationQuestions({ evaluation, user, onComplete, onCancel }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [startTime] = useState(new Date())

  useEffect(() => {
    loadQuestions()
    
    if (evaluation.time_limit) {
      setTimeRemaining(evaluation.time_limit * 60) // converter para segundos
    }
  }, [evaluation.id])

  useEffect(() => {
    if (timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitEvaluation()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_questions')
        .select(`
          *,
          question_options (*)
        `)
        .eq('evaluation_id', evaluation.id)
        .order('order_index')

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmitEvaluation = async () => {
    setSubmitting(true)
    
    try {
      // Calcular pontuação
      let totalPoints = 0
      let earnedPoints = 0
      
      questions.forEach(question => {
        totalPoints += question.points
        const userAnswer = answers[question.id]
        
        if (question.question_type === 'multiple_choice') {
          const correctOption = question.question_options.find(opt => opt.is_correct)
          if (userAnswer === correctOption?.id) {
            earnedPoints += question.points
          }
        } else if (question.question_type === 'true_false') {
          const correctOption = question.question_options.find(opt => opt.is_correct)
          if (userAnswer === correctOption?.id) {
            earnedPoints += question.points
          }
        }
        // Para text questions, precisaria de avaliação manual
      })
      
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
      const endTime = new Date()
      const timeElapsed = Math.round((endTime - startTime) / 1000)
      
      // Salvar tentativa
      const { error } = await supabase
        .from('evaluation_attempts')
        .insert({
          evaluation_id: evaluation.id,
          student_id: user.id,
          score: Math.round(score),
          time_elapsed: timeElapsed,
          answers: answers,
          completed_at: new Date().toISOString()
        })

      if (error) throw error
      
      onComplete()
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando questões...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header da avaliação */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {evaluation.title}
            </h2>
            <p className="text-gray-600">
              {questions.length} questão(ões) • Nota mínima: {evaluation.passing_score}%
            </p>
          </div>
          
          <div className="text-right">
            {timeRemaining !== null && (
              <div className="text-lg font-mono font-semibold text-red-600">
                {formatTime(timeRemaining)}
              </div>
            )}
            <Button 
              variant="ghost" 
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Card>

      {/* Questões */}
      {questions.map((question, index) => (
        <Card key={question.id} className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {index + 1}. {question.question_text}
            </h3>
            {question.is_required && (
              <span className="text-red-600 text-sm">* Obrigatória</span>
            )}
          </div>

          {question.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {question.question_options.map(option => (
                <label key={option.id} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option.id}
                    onChange={(e) => handleAnswerChange(question.id, option.id)}
                    className="mt-1 text-blue-600"
                  />
                  <span className="text-gray-700">{option.option_text}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="space-y-3">
              {question.question_options.map(option => (
                <label key={option.id} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option.id}
                    onChange={(e) => handleAnswerChange(question.id, option.id)}
                    className="mt-1 text-blue-600"
                  />
                  <span className="text-gray-700">{option.option_text}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'text' && (
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Digite sua resposta..."
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            />
          )}
        </Card>
      ))}

      {/* Botão de submissão */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Progresso: {Object.keys(answers).length} de {questions.length} questões respondidas
          </div>
          
          <Button
            onClick={handleSubmitEvaluation}
            disabled={submitting || Object.keys(answers).length === 0}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Finalizar Avaliação
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}