'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BookOpen, 
  Layers, 
  ArrowRight, 
  Check,
  X,
  Loader2
} from 'lucide-react'

export default function LessonModuleAssignment({ 
  lesson, 
  availableModules = [], 
  onAssign 
}) {
  const [selectedModuleId, setSelectedModuleId] = useState(lesson.module_id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(selectedModuleId !== (lesson.module_id || ''))
  }, [selectedModuleId, lesson.module_id])

  const handleAssign = async () => {
    if (!hasChanges) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/lessons/assign-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          moduleId: selectedModuleId || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao associar aula')
      }

      // Chamar callback para atualizar o estado na interface
      onAssign?.(lesson.id, selectedModuleId || null)
      
      setHasChanges(false)
      console.log('Aula associada com sucesso')
    } catch (error) {
      console.error('Erro ao associar aula:', error)
      alert('Erro ao associar aula ao módulo: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedModuleId(lesson.module_id || '')
    setHasChanges(false)
  }

  const currentModule = availableModules.find(m => m.id === lesson.module_id)

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
            <p className="text-sm text-gray-500">
              Posição: {lesson.order_index + 1}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Layers className="w-4 h-4" />
          <span>
            {currentModule ? currentModule.title : 'Sem módulo'}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar módulo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-gray-500" />
                  <span>Sem módulo</span>
                </div>
              </SelectItem>
              {availableModules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>{module.title}</span>
                    {!module.is_active && (
                      <span className="text-xs text-orange-600">(Inativo)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={handleAssign}
            disabled={!hasChanges || isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Card>
  )
}