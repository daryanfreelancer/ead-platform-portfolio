'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import QuestionFormModal from './question-form-modal'
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  HelpCircle, 
  Circle, 
  Check, 
  Type,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

export default function QuestionsManagementModal({ 
  isOpen, 
  onClose, 
  evaluation 
}) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  useEffect(() => {
    if (isOpen && evaluation) {
      loadQuestions()
    }
  }, [isOpen, evaluation])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/evaluation-questions?evaluationId=${evaluation.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar questões')
      }
      
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = () => {
    setSelectedQuestion(null)
    setShowQuestionForm(true)
  }

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setShowQuestionForm(true)
  }

  const handleDeleteQuestion = async (question) => {
    if (window.confirm(`Tem certeza que deseja deletar esta questão?\n\n"${question.question_text}"\n\nEsta ação não pode ser desfeita.`)) {
      try {
        const response = await fetch(`/api/evaluation-questions/${question.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Erro ao deletar questão')
        }

        await loadQuestions()
      } catch (error) {
        console.error('Erro ao deletar questão:', error)
        alert('Erro ao deletar questão: ' + error.message)
      }
    }
  }

  const handleQuestionSaved = () => {
    setShowQuestionForm(false)
    loadQuestions()
  }

  const moveQuestion = async (questionId, direction) => {
    try {
      const response = await fetch(`/api/evaluation-questions/${questionId}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction })
      })

      if (!response.ok) {
        throw new Error('Erro ao reordenar questão')
      }

      await loadQuestions()
    } catch (error) {
      console.error('Erro ao reordenar questão:', error)
    }
  }

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <Circle className="w-4 h-4 text-blue-600" />
      case 'true_false': return <Check className="w-4 h-4 text-green-600" />
      case 'text': return <Type className="w-4 h-4 text-purple-600" />
      default: return <HelpCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice': return 'Múltipla Escolha'
      case 'true_false': return 'Verdadeiro/Falso'
      case 'text': return 'Dissertativa'
      default: return type
    }
  }

  const getTotalPoints = () => {
    return questions.reduce((total, question) => total + (question.points || 0), 0)
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
      <Card className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Gerenciar Questões
            </h2>
            <p className="text-sm text-gray-600">
              {evaluation?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Estatísticas da Avaliação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {questions.length} Questões
              </span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {getTotalPoints()} Pontos Total
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                Nota Mínima: {evaluation?.passing_score || 70}%
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Botão Adicionar Questão */}
        <div className="mb-6">
          <Button onClick={handleAddQuestion} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova Questão
          </Button>
        </div>

        {/* Lista de Questões */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando questões...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Nenhuma questão cadastrada
            </h3>
            <p className="text-gray-500 mb-4">
              Adicione questões para que os alunos possam realizar esta avaliação.
            </p>
            <Button onClick={handleAddQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Questão
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Número e Tipo da Questão */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {getQuestionTypeIcon(question.question_type)}
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo da Questão */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {question.question_text}
                    </h4>
                    
                    {/* Opções (se houver) */}
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {question.options.slice(0, 3).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${
                              option.is_correct ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span className={option.is_correct ? 'text-green-700 font-medium' : 'text-gray-600'}>
                              {option.option_text}
                            </span>
                          </div>
                        ))}
                        {question.options.length > 3 && (
                          <div className="text-xs text-gray-500 ml-4">
                            +{question.options.length - 3} opções...
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Pontos: {question.points || 1}</span>
                      {question.is_required && <span>Obrigatória</span>}
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-1">
                    {/* Mover para cima */}
                    {index > 0 && (
                      <button
                        onClick={() => moveQuestion(question.id, 'up')}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    
                    {/* Mover para baixo */}
                    {index < questions.length - 1 && (
                      <button
                        onClick={() => moveQuestion(question.id, 'down')}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    
                    {/* Editar */}
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Editar questão"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {/* Deletar */}
                    <button
                      onClick={() => handleDeleteQuestion(question)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Deletar questão"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Rodapé com Resumo */}
        {questions.length > 0 && (
          <div className="mt-6 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
              <div className="text-gray-600">
                <strong>{questions.length}</strong> questões totalizando <strong>{getTotalPoints()}</strong> pontos
              </div>
              <div className="text-gray-600">
                Nota mínima para aprovação: <strong>{evaluation?.passing_score || 70}%</strong>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal para Adicionar/Editar Questão */}
      <QuestionFormModal
        isOpen={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        question={selectedQuestion}
        evaluationId={evaluation?.id}
        onSuccess={handleQuestionSaved}
      />
    </div>
  )
}