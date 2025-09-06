'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

const COURSE_CATEGORIES = {
  capacitacao: { label: 'Capacitação', color: 'bg-green-100 text-green-800' },
  tecnologo: { label: 'Tecnólogo', color: 'bg-blue-100 text-blue-800' },
  bacharel: { label: 'Bacharel', color: 'bg-purple-100 text-purple-800' },
  licenciatura: { label: 'Licenciatura', color: 'bg-indigo-100 text-indigo-800' },
  tecnico_competencia: { label: 'Técnico por Competência', color: 'bg-orange-100 text-orange-800' },
  tecnico: { label: 'Técnico', color: 'bg-yellow-100 text-yellow-800' },
  mestrado: { label: 'Mestrado', color: 'bg-red-100 text-red-800' },
  doutorado: { label: 'Doutorado', color: 'bg-pink-100 text-pink-800' },
  pos_doutorado: { label: 'Pós-Doutorado', color: 'bg-gray-100 text-gray-800' }
}

const courseSchema = z.object({
  nome_curso: z.string().min(3, 'Nome do curso deve ter pelo menos 3 caracteres').max(200, 'Nome muito longo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  subcategoria: z.string().optional(),
  is_active: z.boolean()
})

export default function CourseCatalogForm({ isOpen, onClose, course, onSave, loading }) {
  const [formErrors, setFormErrors] = useState('')
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      nome_curso: '',
      categoria: 'capacitacao',
      subcategoria: '',
      is_active: true
    }
  })

  // Preencher formulário ao editar curso
  useEffect(() => {
    if (course && isOpen) {
      setValue('nome_curso', course.nome_curso)
      setValue('categoria', course.categoria)
      setValue('subcategoria', course.subcategoria || '')
      setValue('is_active', course.is_active)
    } else if (isOpen) {
      reset({
        nome_curso: '',
        categoria: 'capacitacao',
        subcategoria: '',
        is_active: true
      })
    }
  }, [course, isOpen, setValue, reset])

  const onSubmit = async (data) => {
    try {
      setFormErrors('')
      await onSave(data)
    } catch (error) {
      console.error('Erro ao salvar curso:', error)
      setFormErrors(error.message || 'Erro ao salvar curso')
    }
  }

  const handleClose = () => {
    setFormErrors('')
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {course ? 'Editar Curso' : 'Novo Curso'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Nome do Curso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Curso *
            </label>
            <Input
              {...register('nome_curso')}
              placeholder="Digite o nome do curso..."
              className={errors.nome_curso ? 'border-red-500' : ''}
            />
            {errors.nome_curso && (
              <p className="text-sm text-red-600 mt-1">{errors.nome_curso.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              {...register('categoria')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(COURSE_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <p className="text-sm text-red-600 mt-1">{errors.categoria.message}</p>
            )}
          </div>

          {/* Subcategoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategoria
            </label>
            <Input
              {...register('subcategoria')}
              placeholder="Subcategoria (opcional)"
              className={errors.subcategoria ? 'border-red-500' : ''}
            />
            {errors.subcategoria && (
              <p className="text-sm text-red-600 mt-1">{errors.subcategoria.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Ex: Gestão de Projetos, Desenvolvimento Web, etc.
            </p>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Curso ativo (visível publicamente)
            </label>
          </div>

          {/* Erro geral */}
          {formErrors && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{formErrors}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading || isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1"
            >
              {loading || isSubmitting ? 'Salvando...' : course ? 'Salvar Alterações' : 'Criar Curso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}