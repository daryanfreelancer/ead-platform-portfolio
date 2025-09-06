'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Clock,
  User,
  FileText,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
  Calendar,
  Target,
  CheckCircle
} from 'lucide-react'

export default function GradingCorrectionModal({ 
  isOpen, 
  onClose,
  onGradeCompleted 
}) {
  const [pendingAttempts, setPendingAttempts] = useState([])
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [grades, setGrades] = useState({})
  const [feedback, setFeedback] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadPendingAttempts()
    }
  }, [isOpen])

  const loadPendingAttempts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation-attempts/pending-grading')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar tentativas pendentes')
      }
      
      const data = await response.json()
      setPendingAttempts(data.attempts || [])
    } catch (error) {
      console.error('Erro ao carregar tentativas:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAttemptDetails = async (attempt) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/evaluation-attempts/${attempt.id}/grading-details`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes da tentativa')
      }
      
      const data = await response.json()
      setSelectedAttempt(data.attempt)
      
      // Inicializar grades e feedback com valores existentes
      const initialGrades = {}
      const initialFeedback = {}
      
      data.attempt.answers?.forEach(answer => {
        if (answer.question.question_type === 'text') {
          initialGrades[answer.question.id] = answer.manual_score || 0
          initialFeedback[answer.question.id] = answer.manual_feedback || ''
        }
      })
      
      setGrades(initialGrades)
      setFeedback(initialFeedback)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/evaluation-attempts/${selectedAttempt.id}/manual-grading`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grades,
          feedback
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar correção')
      }

      const result = await response.json()
      
      // Atualizar lista de tentativas pendentes
      setPendingAttempts(prev => prev.filter(attempt => attempt.id !== selectedAttempt.id))
      setSelectedAttempt(null)
      setGrades({})
      setFeedback({})
      
      // Notificar parent component
      onGradeCompleted?.(result.attempt)
      
    } catch (error) {
      console.error('Erro ao salvar correção:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGradeChange = (questionId, value) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: Math.max(0, parseFloat(value) || 0)
    }))
  }

  const handleFeedbackChange = (questionId, value) => {
    setFeedback(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const getMaxScore = (question) => {
    return question.points || 1
  }

  const getCurrentScore = (questionId) => {
    return grades[questionId] || 0
  }

  const getTotalEssayQuestions = () => {
    if (!selectedAttempt?.answers) return 0
    return selectedAttempt.answers.filter(answer => answer.question.question_type === 'text').length
  }

  const getGradedEssayQuestions = () => {
    const essayQuestions = selectedAttempt?.answers?.filter(answer => answer.question.question_type === 'text') || []
    return essayQuestions.filter(answer => {
      const grade = grades[answer.question.id]
      return grade !== undefined && grade !== null
    }).length
  }

  const canSubmitGrading = () => {
    const essayQuestions = selectedAttempt?.answers?.filter(answer => answer.question.question_type === 'text') || []
    return essayQuestions.every(answer => {
      const grade = grades[answer.question.id]
      return grade !== undefined && grade !== null && grade >= 0
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative z-50 w-full max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 pr-2">
            <span className="hidden sm:inline">Correção Manual de Questões Dissertativas</span>
            <span className="sm:hidden">Correção Manual</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!selectedAttempt ? (
          <>
            {/* Lista de tentativas pendentes */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Tentativas Aguardando Correção
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando tentativas...</p>
                </div>
              ) : pendingAttempts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Todas as correções foram finalizadas
                  </h3>
                  <p className="text-gray-500">
                    Não há tentativas de avaliação aguardando correção manual.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAttempts.map((attempt) => (
                    <Card key={attempt.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium text-gray-900 truncate">
                                {attempt.student.full_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                {new Date(attempt.submitted_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1 min-w-0">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{attempt.evaluation.title}</span>
                            </div>
                            <div className="flex items-center gap-1 min-w-0">
                              <Target className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Curso: {attempt.evaluation.course.title}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => loadAttemptDetails(attempt)}
                          className="w-full sm:w-auto sm:ml-4 min-h-[44px]"
                          disabled={loading}
                        >
                          Corrigir
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Interface de correção */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                    Corrigindo: {selectedAttempt.evaluation.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="block sm:inline">Aluno: {selectedAttempt.student.full_name}</span>
                    <span className="hidden sm:inline"> • </span>
                    <span className="block sm:inline">Curso: {selectedAttempt.evaluation.course.title}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAttempt(null)}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Voltar à Lista</span>
                  <span className="sm:hidden">Voltar</span>
                </Button>
              </div>

              {/* Progresso da correção */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-blue-800">
                    <span className="hidden sm:inline">Progresso da Correção: </span>
                    <span className="sm:hidden">Progresso: </span>
                    {getGradedEssayQuestions()} de {getTotalEssayQuestions()} questões
                  </span>
                  <span className="text-blue-600 font-medium text-right">
                    {Math.round((getGradedEssayQuestions() / getTotalEssayQuestions()) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(getGradedEssayQuestions() / getTotalEssayQuestions()) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Questões dissertativas para correção */}
            <div className="space-y-4 sm:space-y-6">
              {selectedAttempt.answers
                ?.filter(answer => answer.question.question_type === 'text')
                .map((answer, index) => (
                  <Card key={answer.question.id} className="p-4 sm:p-6">
                    <div className="mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900">
                          Questão {index + 1}
                        </h4>
                        <span className="text-xs sm:text-sm text-blue-600 font-medium">
                          Valor: {getMaxScore(answer.question)} {getMaxScore(answer.question) === 1 ? 'ponto' : 'pontos'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        {answer.question.question_text}
                      </p>
                    </div>

                    {/* Resposta do aluno */}
                    <div className="mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Resposta do Aluno:
                      </label>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
                        <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">
                          {answer.answer_data?.text_answer || 'Resposta não fornecida'}
                        </p>
                      </div>
                    </div>

                    {/* Avaliação */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Nota (0 a {getMaxScore(answer.question)})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={getMaxScore(answer.question)}
                          step="0.1"
                          value={getCurrentScore(answer.question.id)}
                          onChange={(e) => handleGradeChange(answer.question.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px]"
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Feedback (Opcional)
                        </label>
                        <textarea
                          value={feedback[answer.question.id] || ''}
                          onChange={(e) => handleFeedbackChange(answer.question.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          placeholder="Comentários sobre a resposta..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Explicação da questão (se houver) */}
                    {answer.question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 mb-1">
                              Explicação da Questão:
                            </p>
                            <p className="text-sm text-blue-700">
                              {answer.question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedAttempt(null)}
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGradeSubmit}
                disabled={!canSubmitGrading() || saving}
                className="w-full sm:w-auto min-w-[120px] min-h-[44px] order-1 sm:order-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Salvando...</span>
                    <span className="sm:hidden">Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Finalizar Correção</span>
                    <span className="sm:hidden">Finalizar</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}