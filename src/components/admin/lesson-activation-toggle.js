'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LessonActivationToggle({ 
  lesson, 
  onToggle,
  disabled = false,
  size = 'sm'
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [reason, setReason] = useState('')

  const handleToggle = async (newState) => {
    // Se está desativando, pedir motivo
    if (!newState) {
      setShowReasonModal(true)
      return
    }

    // Se está ativando, fazer direto
    await performToggle(newState)
  }

  const performToggle = async (newState, reasonText = '') => {
    setIsLoading(true)
    setShowReasonModal(false)

    try {
      const response = await fetch('/api/admin/toggle-lesson-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          isActive: newState,
          reason: reasonText
        })
      })

      const data = await response.json()

      if (response.ok) {
        onToggle?.(lesson.id, newState)
        
        // Mostrar notificação de sucesso
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50'
        notification.textContent = data.message
        document.body.appendChild(notification)
        
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 3000)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao alterar ativação:', error)
      
      // Mostrar notificação de erro
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50'
      notification.textContent = `Erro: ${error.message}`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 4000)
    } finally {
      setIsLoading(false)
      setReason('')
    }
  }

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600' : 'text-orange-600'
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-full overflow-hidden">
        {/* Indicador visual compacto */}
        <div className={`flex items-center gap-1 ${getStatusColor(lesson.is_active)} flex-shrink-0`}>
          {lesson.is_active ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
          <span className="text-xs font-medium whitespace-nowrap">
            {lesson.is_active ? 'Ativa' : 'Inativa'}
          </span>
        </div>

        {/* Switch de ativação */}
        <div className="flex items-center gap-1 min-h-[44px] flex-shrink-0">
          <Switch
            checked={lesson.is_active}
            onCheckedChange={handleToggle}
            disabled={disabled || isLoading}
            size={size}
            className="min-h-[44px]"
          />
          {isLoading && (
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          )}
        </div>
      </div>

      {/* Modal para motivo da desativação */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Desativar Aula</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Você está prestes a desativar a aula "{lesson.title}". 
              A aula ficará oculta para os estudantes.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da desativação (opcional):
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                rows={3}
                placeholder="Ex: Conteúdo em revisão, problemas técnicos, etc."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReasonModal(false)
                  setReason('')
                }}
                className="w-full sm:w-auto min-h-[44px]"
              >
                <span className="whitespace-nowrap">Cancelar</span>
              </Button>
              <Button
                variant="destructive"
                onClick={() => performToggle(false, reason)}
                disabled={isLoading}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="whitespace-nowrap">Desativando...</span>
                  </div>
                ) : (
                  <span className="whitespace-nowrap">Desativar Aula</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}