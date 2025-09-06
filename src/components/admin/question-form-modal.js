'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Trash2, Check, Circle, Square, Type } from 'lucide-react'

export default function QuestionFormModal({ 
  isOpen, 
  onClose, 
  question = null,
  evaluationId,
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    points: '1',
    explanation: '',
    isRequired: true,
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Preencher dados quando editando
  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.question_text || '',
        questionType: question.question_type || 'multiple_choice',
        points: question.points?.toString() || '1',
        explanation: question.explanation || '',
        isRequired: question.is_required !== false,
        options: question.options?.length > 0 
          ? question.options.map(opt => ({
              optionText: opt.option_text,
              isCorrect: opt.is_correct
            }))
          : [
              { optionText: '', isCorrect: false },
              { optionText: '', isCorrect: false }
            ]
      })
    } else {
      // Reset form for new question
      setFormData({
        questionText: '',
        questionType: 'multiple_choice',
        points: '1',
        explanation: '',
        isRequired: true,
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      })
    }
  }, [question])

  const handleTypeChange = (type) => {
    setFormData(prev => {
      const newData = { ...prev, questionType: type }
      
      // Ajustar opções baseado no tipo
      if (type === 'true_false') {
        newData.options = [
          { optionText: 'Verdadeiro', isCorrect: false },
          { optionText: 'Falso', isCorrect: false }
        ]
      } else if (type === 'text') {
        newData.options = []
      } else if (prev.questionType === 'true_false' && type === 'multiple_choice') {
        // Resetar opções se estava em true_false
        newData.options = [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }
      
      return newData
    })
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options]
    
    if (field === 'isCorrect' && value === true) {
      // Para múltipla escolha, pode ter várias corretas
      // Para verdadeiro/falso, apenas uma correta
      if (formData.questionType === 'true_false') {
        newOptions.forEach((opt, i) => {
          opt.isCorrect = i === index
        })
      } else {
        newOptions[index].isCorrect = value
      }
    } else {
      newOptions[index][field] = value
    }
    
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, { optionText: '', isCorrect: false }]
      })
    }
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData({ ...formData, options: newOptions })
    }
  }

  const validateForm = () => {
    if (!formData.questionText.trim()) {
      setError('O texto da questão é obrigatório')
      return false
    }

    if (formData.questionType !== 'text') {
      // Verificar se há pelo menos uma resposta correta
      const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect)
      if (!hasCorrectAnswer) {
        setError('Selecione pelo menos uma resposta correta')
        return false
      }

      // Verificar se todas as opções têm texto
      const allOptionsHaveText = formData.options.every(opt => opt.optionText.trim())
      if (!allOptionsHaveText) {
        setError('Todas as opções devem ter texto')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setError(null)
    setIsLoading(true)

    try {
      const url = question 
        ? `/api/evaluation-questions/${question.id}`
        : '/api/evaluation-questions'
      
      const method = question ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId,
          questionText: formData.questionText.trim(),
          questionType: formData.questionType,
          points: parseFloat(formData.points),
          explanation: formData.explanation.trim(),
          isRequired: formData.isRequired,
          options: formData.questionType !== 'text' 
            ? formData.options.map((opt, index) => ({
                optionText: opt.optionText.trim(),
                isCorrect: opt.isCorrect,
                orderIndex: index
              }))
            : []
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar questão')
      }

      onSuccess?.(data.question)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar questão:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const getTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <Circle className="w-4 h-4" />
      case 'true_false': return <Check className="w-4 h-4" />
      case 'text': return <Type className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {question ? 'Editar Questão' : 'Adicionar Questão'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Questão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Questão
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('multiple_choice')}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  formData.questionType === 'multiple_choice' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Circle className="w-5 h-5" />
                <span className="text-xs font-medium">Múltipla Escolha</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('true_false')}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  formData.questionType === 'true_false' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-medium">Verdadeiro/Falso</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('text')}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  formData.questionType === 'text' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Type className="w-5 h-5" />
                <span className="text-xs font-medium">Dissertativa</span>
              </button>
            </div>
          </div>

          {/* Texto da Questão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pergunta *
            </label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Digite a pergunta..."
              rows={3}
              required
            />
          </div>

          {/* Opções de Resposta */}
          {formData.questionType !== 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opções de Resposta
              </label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={formData.questionType === 'true_false' ? 'radio' : 'checkbox'}
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                      name={formData.questionType === 'true_false' ? 'correct-answer' : undefined}
                    />
                    <input
                      type="text"
                      value={option.optionText}
                      onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder={`Opção ${index + 1}`}
                      disabled={formData.questionType === 'true_false'}
                      required
                    />
                    {formData.questionType === 'multiple_choice' && formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {formData.questionType === 'multiple_choice' && formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Opção
                </button>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {formData.questionType === 'multiple_choice' 
                  ? 'Marque as opções corretas (pode ter mais de uma)'
                  : 'Selecione a resposta correta'}
              </p>
            </div>
          )}

          {/* Configurações Adicionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pontos
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                min="0.5"
                step="0.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obrigatória
              </label>
              <Select 
                value={formData.isRequired.toString()} 
                onValueChange={(value) => setFormData({ ...formData, isRequired: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Explicação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explicação da Resposta (Opcional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Explique a resposta correta (será mostrada após a avaliação)..."
              rows={2}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? 'Salvando...' : (question ? 'Salvar' : 'Adicionar')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}