'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/button'
import { 
  PlayCircle,
  CheckCircle,
  Circle,
  Loader2
} from 'lucide-react'

export function LessonProgressButton({ lesson, enrollment, onProgressUpdate }) {
  const [loading, setLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    loadProgress()
  }, [lesson.id])

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/lesson-progress?lesson_id=${lesson.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data && (data.progress_percentage > 0 || data.completed_at)) {
          setIsStarted(true)
          setIsCompleted(data.progress_percentage >= 100 || !!data.completed_at)
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const handleProgressToggle = async () => {
    setLoading(true)
    
    try {
      // Fluxo de 3 etapas:
      // 1. Não iniciada -> Iniciada (50%)
      // 2. Iniciada -> Concluída (100%)
      // 3. Concluída -> Não iniciada (0%)
      let newProgress = 0
      let newCompleted = false
      
      if (!isStarted && !isCompleted) {
        // Estado 1: Não iniciada -> Iniciada
        newProgress = 50
        newCompleted = false
      } else if (isStarted && !isCompleted) {
        // Estado 2: Iniciada -> Concluída
        newProgress = 100
        newCompleted = true
      } else if (isCompleted) {
        // Estado 3: Concluída -> Não iniciada
        newProgress = 0
        newCompleted = false
      }

      const response = await fetch('/api/lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          progress_percentage: newProgress
        })
      })

      if (response.ok) {
        // Update UI state after successful API call
        setIsStarted(newProgress > 0)
        setIsCompleted(newCompleted)
        
        // Trigger parent component update
        onProgressUpdate?.(newProgress)
        
        // Force re-render by reloading progress after small delay
        setTimeout(() => {
          loadProgress()
        }, 200)
      } else {
        console.error('Error updating lesson progress:', response.status)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getButtonState = () => {
    if (loading) {
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        text: 'Atualizando...',
        variant: 'secondary',
        disabled: true
      }
    }

    if (isCompleted) {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        text: 'Aula Concluída',
        variant: 'primary',
        className: '!bg-green-600 hover:!bg-green-700 text-white',
        disabled: false
      }
    }

    if (isStarted) {
      return {
        icon: <Circle className="w-5 h-5" />,
        text: 'Marcar como Concluída',
        variant: 'primary',
        disabled: false
      }
    }

    return {
      icon: <PlayCircle className="w-5 h-5" />,
      text: 'Iniciar Aula',
      variant: 'primary',
      disabled: false
    }
  }

  const buttonState = getButtonState()

  return (
    <Button
      onClick={handleProgressToggle}
      disabled={buttonState.disabled}
      variant={buttonState.variant}
      size="lg"
      className={`
        flex items-center gap-2 transform hover:scale-105
        min-h-[48px] w-full sm:w-auto justify-center
        ${buttonState.className || ''}
      `}
    >
      {buttonState.icon}
      <span>{buttonState.text}</span>
    </Button>
  )
}