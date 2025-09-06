'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ModuleCourseSelector from './module-course-selector'
import { X, Loader2 } from 'lucide-react'

export default function ModuleFormModal({ 
  isOpen, 
  onClose, 
  module = null, 
  courseId = null,
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: courseId || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Preencher dados quando editando
  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || '',
        description: module.description || '',
        courseId: module.course_id || courseId || ''
      })
    } else {
      setFormData({
        title: '',
        description: '',
        courseId: courseId || ''
      })
    }
  }, [module, courseId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const url = module 
        ? `/api/admin/modules/${module.id}`
        : '/api/admin/modules'
      
      const method = module ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          courseId: formData.courseId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar módulo')
      }

      onSuccess?.(data.module)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar módulo:', error)
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
      <Card className="relative z-50 w-full max-w-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {module ? 'Editar Módulo' : 'Criar Novo Módulo'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título do Módulo *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Ex: Módulo 1 - Introdução"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Descreva o conteúdo deste módulo..."
              rows={3}
            />
          </div>

          {!courseId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso *
              </label>
              <ModuleCourseSelector
                value={formData.courseId}
                onChange={(value) => setFormData({ ...formData, courseId: value })}
              />
            </div>
          )}

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
                module ? 'Salvar Alterações' : 'Criar Módulo'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}