'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Loader2, Clock, Target, Eye, Shuffle } from 'lucide-react'

export default function EvaluationFormModal({ 
  isOpen, 
  onClose, 
  evaluation = null,
  courseId = null,
  courses = [],
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    courseId: courseId || '',
    moduleId: '',
    title: '',
    description: '',
    instructions: '',
    timeLimit: '',
    maxAttempts: '1',
    passingScore: '70',
    randomizeQuestions: false,
    showResultsImmediately: true,
    showCorrectAnswers: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modules, setModules] = useState([])

  // Preencher dados quando editando
  useEffect(() => {
    if (evaluation) {
      setFormData({
        courseId: evaluation.course_id || courseId || '',
        moduleId: evaluation.module_id || '',
        title: evaluation.title || '',
        description: evaluation.description || '',
        instructions: evaluation.instructions || '',
        timeLimit: evaluation.time_limit || '',
        maxAttempts: evaluation.max_attempts?.toString() || '1',
        passingScore: evaluation.passing_score?.toString() || '70',
        randomizeQuestions: evaluation.randomize_questions || false,
        showResultsImmediately: evaluation.show_results_immediately !== false,
        showCorrectAnswers: evaluation.show_correct_answers !== false
      })
    } else {
      setFormData({
        courseId: courseId || '',
        moduleId: '',
        title: '',
        description: '',
        instructions: '',
        timeLimit: '',
        maxAttempts: '1',
        passingScore: '70',
        randomizeQuestions: false,
        showResultsImmediately: true,
        showCorrectAnswers: true
      })
    }
  }, [evaluation, courseId])

  // Buscar aulas e módulos quando curso muda
  useEffect(() => {
    if (formData.courseId) {
      fetchLessonsAndModules(formData.courseId)
    }
  }, [formData.courseId])

  const fetchLessonsAndModules = async (selectedCourseId) => {
    try {
      // Buscar módulos
      const modulesResponse = await fetch(`/api/admin/modules?courseId=${selectedCourseId}`)
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json()
        setModules(modulesData.modules || [])
      }
    } catch (error) {
      console.error('Erro ao buscar módulos:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = evaluation 
        ? `/api/evaluations/${evaluation.id}`
        : '/api/evaluations'
      
      const method = evaluation ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: formData.courseId,
          moduleId: formData.moduleId || null,
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          maxAttempts: parseInt(formData.maxAttempts),
          passingScore: parseFloat(formData.passingScore),
          randomizeQuestions: formData.randomizeQuestions,
          showResultsImmediately: formData.showResultsImmediately,
          showCorrectAnswers: formData.showCorrectAnswers
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar avaliação')
      }

      onSuccess?.(data.evaluation)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
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
      <Card className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {evaluation ? 'Editar Avaliação' : 'Criar Nova Avaliação'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Informações Básicas</h3>
            
            {!courseId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Curso *
                </label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Avaliação *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Ex: Avaliação do Módulo 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Descreva o objetivo desta avaliação..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruções para o Estudante
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Instruções específicas sobre como realizar a avaliação..."
                rows={3}
              />
            </div>
          </div>

          {/* Associação ao Módulo */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Associação ao Módulo (Opcional)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Módulo
              </label>
              <Select value={formData.moduleId} onValueChange={(value) => setFormData({ ...formData, moduleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum módulo específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum módulo específico</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Associe a avaliação a um módulo específico do curso
              </p>
            </div>
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configurações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Tempo Limite (minutos)
                </label>
                <input
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Sem limite"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Tentativas
                </label>
                <input
                  type="number"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  Nota Mínima (%)
                </label>
                <input
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Opções Avançadas */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Opções Avançadas</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.randomizeQuestions}
                  onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  <Shuffle className="w-4 h-4 inline mr-1" />
                  Embaralhar ordem das questões
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.showResultsImmediately}
                  onChange={(e) => setFormData({ ...formData, showResultsImmediately: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Mostrar resultados imediatamente
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.showCorrectAnswers}
                  onChange={(e) => setFormData({ ...formData, showCorrectAnswers: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Mostrar respostas corretas após submissão
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title || !formData.courseId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                evaluation ? 'Salvar Alterações' : 'Criar Avaliação'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}