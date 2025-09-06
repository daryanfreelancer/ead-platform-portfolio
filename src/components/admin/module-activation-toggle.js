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

export default function ModuleActivationToggle({ 
  module, 
  onToggle, 
  disabled = false, 
  size = 'default' 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleToggle = async () => {
    const newState = !module.is_active
    
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
      const response = await fetch('/api/admin/toggle-module-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: module.id,
          isActive: newState,
          reason
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alternar ativação')
      }

      // Chamar callback para atualizar o estado na interface
      onToggle?.(module.id, newState)

      // Feedback visual
      if (newState) {
        console.log('Módulo ativado com sucesso')
      } else {
        console.log('Módulo desativado com sucesso')
      }
    } catch (error) {
      console.error('Erro ao alternar ativação do módulo:', error)
      alert('Erro ao alterar status do módulo: ' + error.message)
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
        checked={module.is_active}
        onCheckedChange={handleToggle}
        disabled={disabled || isLoading}
        size={size}
      />

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-orange-600" />
              Desativar Módulo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o módulo &quot;{module.title}&quot;?
              
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Consequências:</strong>
                </p>
                <ul className="text-sm text-orange-700 mt-2 space-y-1">
                  <li>• O módulo ficará oculto para todos os estudantes</li>
                  <li>• Todas as aulas dentro do módulo ficarão inacessíveis</li>
                  <li>• O progresso dos estudantes será pausado</li>
                  <li>• Pode ser reativado a qualquer momento</li>
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
              {isLoading ? 'Desativando...' : 'Desativar Módulo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}