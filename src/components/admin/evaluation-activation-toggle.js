'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { Eye, EyeOff } from 'lucide-react'

export default function EvaluationActivationToggle({ 
  evaluation, 
  onToggle, 
  disabled = false, 
  size = 'default' 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleToggle = async () => {
    const newState = !evaluation.is_active
    
    // Se estiver desativando, mostrar diálogo de confirmação
    if (!newState) {
      setShowDialog(true)
      return
    }
    
    // Se estiver ativando, fazer diretamente
    await performToggle(newState)
  }

  const performToggle = async (newState, reason = null) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/toggle-evaluation-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: evaluation.id,
          isActive: newState,
          reason
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alternar ativação')
      }

      // Chamar callback para atualizar o estado na interface
      onToggle?.(evaluation.id, newState)

      // Feedback visual
      if (newState) {
        console.log('Avaliação ativada com sucesso')
      } else {
        console.log('Avaliação desativada com sucesso')
      }
    } catch (error) {
      console.error('Erro ao alternar ativação da avaliação:', error)
      alert('Erro ao alterar status da avaliação: ' + error.message)
    } finally {
      setIsLoading(false)
      setShowDialog(false)
    }
  }

  const handleDeactivateConfirm = async () => {
    await performToggle(false)
  }

  return (
    <>
      <Switch
        checked={evaluation.is_active}
        onCheckedChange={handleToggle}
        disabled={disabled || isLoading}
        size={size}
      />

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-orange-600" />
              Desativar Avaliação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a avaliação &quot;{evaluation.title}&quot;?
              
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Consequências:</strong>
                </p>
                <ul className="text-sm text-orange-700 mt-2 space-y-1">
                  <li>• A avaliação ficará invisível para os estudantes</li>
                  <li>• Estudantes não poderão iniciar novas tentativas</li>
                  <li>• Tentativas em andamento poderão ser finalizadas</li>
                  <li>• Pode ser reativada a qualquer momento</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeactivateConfirm}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? 'Desativando...' : 'Desativar Avaliação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}