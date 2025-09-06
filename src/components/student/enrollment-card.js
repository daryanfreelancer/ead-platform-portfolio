'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Link from 'next/link'
import { useDeleteOperations } from '@/hooks/use-delete-operations'
import { X, BookOpen, CheckCircle, Play } from 'lucide-react'

export default function EnrollmentCard({ enrollment, onUnenroll }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const { unenrollFromCourse, loading, error } = useDeleteOperations()

  const handleUnenroll = async () => {
    const result = await unenrollFromCourse(
      enrollment.id,
      enrollment.student_id,
      enrollment.courses?.id
    )
    
    if (result.success) {
      onUnenroll(enrollment.id)
      alert('Você foi desmatriculado do curso com sucesso!')
    } else {
      alert('Erro ao desmatricular: ' + result.error)
    }
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">⚠️</div>
          <h4 className="font-semibold text-lg mb-2 text-red-800">
            Desmatricular do Curso
          </h4>
          <p className="text-red-700 text-sm mb-4">
            Tem certeza que deseja se desmatricular do curso &quot;{enrollment.courses?.title}&quot;?
          </p>
          <p className="text-red-600 text-xs mb-6">
            Seu progresso será perdido e você perderá acesso ao conteúdo.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUnenroll}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {loading ? 'Desmatriculando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow p-6 relative group">
      {/* Botão de desmatricular */}
      <button
        onClick={() => setShowConfirm(true)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="Desmatricular"
      >
        <X className="w-4 h-4 text-red-600" />
      </button>

      <div className="relative h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mb-4">
        {enrollment.courses?.thumbnail_url ? (
          <img
            src={enrollment.courses?.thumbnail_url}
            alt={enrollment.courses?.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-lg">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
        )}
        
        {/* Badge de status */}
        {enrollment.completed_at && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Concluído
            </div>
          </div>
        )}
      </div>
      <h4 className="font-semibold text-lg mb-2">
        {enrollment.courses?.title}
      </h4>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {enrollment.courses?.description}
      </p>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso</span>
          <span>{enrollment.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${enrollment.progress || 0}%` }}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Link href={`/courses/${enrollment.courses?.id}/learn`} className="flex-1">
          <Button className="w-full flex items-center gap-2 min-h-[44px]">
            <Play className="w-4 h-4" />
            {enrollment.completed_at ? 'Revisar' : 'Continuar Estudando'}
          </Button>
        </Link>
        <Link href={`/courses/${enrollment.courses?.id}`}>
          <Button variant="secondary" className="flex items-center gap-2 min-h-[44px]">
            <BookOpen className="w-4 h-4" />
            Detalhes
          </Button>
        </Link>
      </div>
    </Card>
  )
}