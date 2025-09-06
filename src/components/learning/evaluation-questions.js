'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle,
  Circle,
  Check,
  Type,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

const supabase = createClient()

export function EvaluationQuestions({ evaluation, user, onComplete, onCancel }) {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [attemptId, setAttemptId] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadQuestions()
    createAttempt()
  }, [evaluation.id, user.id])

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitEvaluation(true) // Auto submit when time expires
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const loadQuestions = async () => {
    try {
      const response = await fetch(`/api/evaluation-questions?evaluationId=${evaluation.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar questões')
      }
      
      const data = await response.json()
      setQuestions(data.questions || [])
      
      if (data.questions.length === 0) {
        throw new Error('Esta avaliação não possui questões cadastradas')
      }
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createAttempt = async () => {
    try {
      const response = await fetch('/api/evaluation-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          evaluationId: evaluation.id
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar avaliação')
      }

      const data = await response.json()
      setAttemptId(data.attempt.id)
      
      // Iniciar timer se houver limite de tempo
      if (evaluation.time_limit) {
        setTimeLeft(evaluation.time_limit * 60) // converter para segundos
      }
    } catch (error) {
      console.error('Erro ao criar tentativa:', error)
      setError(error.message)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleMultipleChoiceChange = (questionId, optionId, checked) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || []
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, optionId]
        }
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(id => id !== optionId)
        }
      }
    })
  }

  const handleTrueFalseChange = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [optionId]
    }))
  }

  const handleTextChange = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text.trim()
    }))
  }

  const handleSubmitEvaluation = async (isAutoSubmit = false) => {
    if (submitting) return

    if (!isAutoSubmit) {
      const unansweredRequired = questions.filter(q => 
        q.is_required && 
        (!answers[q.id] || 
         (Array.isArray(answers[q.id]) && answers[q.id].length === 0) ||
         (typeof answers[q.id] === 'string' && !answers[q.id].trim()))
      )

      if (unansweredRequired.length > 0) {
        alert(`Por favor, responda todas as questões obrigatórias. Faltam ${unansweredRequired.length} questões.`)
        return
      }

      if (!window.confirm('Tem certeza que deseja submeter sua avaliação? Esta ação não pode ser desfeita.')) {
        return
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/evaluation-attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao submeter avaliação')
      }

      const data = await response.json()
      setResults(data.results)
      setShowResults(true)
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error)
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <Circle className="w-4 h-4 text-blue-600" />
      case 'true_false': return <Check className="w-4 h-4 text-green-600" />
      case 'text': return <Type className="w-4 h-4 text-purple-600" />
      default: return <Circle className="w-4 h-4 text-gray-600" />
    }
  }

  const isQuestionAnswered = (question) => {
    const answer = answers[question.id]
    if (!answer) return false
    
    if (Array.isArray(answer)) return answer.length > 0
    if (typeof answer === 'string') return answer.trim().length > 0
    
    return true
  }

  const getAnsweredCount = () => {
    return questions.filter(isQuestionAnswered).length
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

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onCancel}>Voltar</Button>
        </div>
      </Card>
    )
  }

  if (showResults && results) {
    const isAwaitingGrading = results.status === 'awaiting_grading' || results.hasUngradedQuestions
    
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isAwaitingGrading 
              ? 'bg-yellow-100' 
              : results.passed 
                ? 'bg-green-100' 
                : 'bg-red-100'
          }`}>
            {isAwaitingGrading ? (
              <Clock className="w-8 h-8 text-yellow-600" />
            ) : results.passed ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-2">
            {isAwaitingGrading 
              ? 'Avaliação Submetida!'
              : results.passed 
                ? 'Parabéns!' 
                : 'Não foi dessa vez'
            }
          </h3>
          
          <p className="text-gray-600 mb-6">
            {results.message || (results.passed 
              ? 'Você foi aprovado na avaliação!'
              : 'Você não atingiu a nota mínima para aprovação.'
            )}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            {isAwaitingGrading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Pontos das Questões Objetivas:</span>
                  <p className="text-2xl font-bold text-blue-600">{results.totalScore} / {results.maxPossibleScore}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tempo Gasto:</span>
                  <p className="text-2xl font-bold text-gray-600">{results.timeSpent} min</p>
                </div>
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Resultado final será calculado após correção das questões dissertativas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Sua Nota:</span>
                  <p className="text-2xl font-bold text-blue-600">{results.score}%</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nota Mínima:</span>
                  <p className="text-2xl font-bold text-gray-600">{evaluation.passing_score}%</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Pontos:</span>
                  <p className="text-lg">{results.totalScore} / {results.maxPossibleScore}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tempo:</span>
                  <p className="text-lg">{results.timeSpent} min</p>
                </div>
              </div>
            )}
          </div>
          
          <Button onClick={onComplete} className="w-full sm:w-auto">
            Continuar Curso
          </Button>
        </div>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Avaliação Sem Questões
        </h3>
        <p className="text-gray-600 mb-4">
          Esta avaliação ainda não possui questões cadastradas.
        </p>
        <Button onClick={onCancel}>Voltar</Button>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:gap-0">
          {/* Linha superior */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {evaluation.title}
              </h2>
            </div>
            
            {/* Timer - sempre visível */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs sm:text-sm flex-shrink-0 ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          
          {/* Linha inferior - contador de respostas */}
          <div className="flex justify-between items-center sm:hidden text-xs text-gray-600">
            <span>{getAnsweredCount()} / {questions.length} respondidas</span>
          </div>
          
          {/* Contador desktop - simples */}
          <div className="hidden sm:flex justify-end">
            <div className="text-sm text-gray-600">
              {getAnsweredCount()} / {questions.length} respondidas
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Question */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {currentQuestionIndex + 1}
            </span>
            {getQuestionTypeIcon(currentQuestion.question_type)}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentQuestion.question_text}
              {currentQuestion.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h3>
            
            <div className="text-sm text-gray-500 mb-4">
              Pontos: {currentQuestion.points || 1}
            </div>
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.question_type === 'multiple_choice' && (
            currentQuestion.options.map((option) => (
              <label key={option.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(answers[currentQuestion.id] || []).includes(option.id)}
                  onChange={(e) => handleMultipleChoiceChange(currentQuestion.id, option.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <span className="text-gray-900">{option.option_text}</span>
              </label>
            ))
          )}
          
          {currentQuestion.question_type === 'true_false' && (
            currentQuestion.options.map((option) => (
              <label key={option.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={(answers[currentQuestion.id] || []).includes(option.id)}
                  onChange={() => handleTrueFalseChange(currentQuestion.id, option.id)}
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <span className="text-gray-900">{option.option_text}</span>
              </label>
            ))
          )}
          
          {currentQuestion.question_type === 'text' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Digite sua resposta..."
              rows={4}
            />
          )}
        </div>
      </Card>

      {/* Navigation and Submit */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Indicador de progresso numérico no mobile */}
          <div className="sm:hidden text-center text-sm text-gray-600">
            Questão {currentQuestionIndex + 1} de {questions.length}
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            
            {/* Navegação numérica - oculta no mobile */}
            <div className="hidden sm:flex items-center gap-2 max-w-md overflow-x-auto">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : isQuestionAnswered(questions[index])
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Dropdown de navegação no mobile */}
            <div className="sm:hidden">
              <select
                value={currentQuestionIndex}
                onChange={(e) => setCurrentQuestionIndex(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded text-black"
              >
                {questions.map((_, index) => (
                  <option key={index} value={index}>
                    {index + 1} {isQuestionAnswered(questions[index]) ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <span className="sm:hidden">→</span>
                  <ChevronRight className="w-4 h-4 hidden sm:inline" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmitEvaluation(false)}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Finalizar Avaliação</span>
                      <span className="sm:hidden">Finalizar</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}