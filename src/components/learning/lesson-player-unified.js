'use client'

import { useState, useEffect } from 'react'
import { VideoPlayerSimple } from './video-player-simple'
import { PDFPlayerSimple } from './pdf-player-simple'
import { TextPlayerSimple } from './text-player-simple'
import { 
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  Type,
  AlertCircle
} from 'lucide-react'

export function LessonPlayerUnified({ course, enrollment, lessons, currentLessonId, onLessonChange, onProgressUpdate }) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [lessonProgress, setLessonProgress] = useState({})

  useEffect(() => {
    const index = lessons.findIndex(lesson => lesson.id === currentLessonId)
    if (index !== -1) {
      setCurrentLessonIndex(index)
    }
  }, [currentLessonId, lessons])

  const currentLesson = lessons[currentLessonIndex]

  if (!currentLesson) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aula não encontrada</h3>
        <p className="text-gray-600">Selecione uma aula da lista ao lado</p>
      </div>
    )
  }

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1]
      onLessonChange(prevLesson.id)
    }
  }

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1]
      onLessonChange(nextLesson.id)
    }
  }

  const handleProgressUpdate = (progress) => {
    setLessonProgress(prev => ({
      ...prev,
      [currentLesson.id]: progress
    }))
    // Notify parent component to update progress display
    onProgressUpdate?.()
  }

  // Determinar tipo de conteúdo
  const getContentType = () => {
    if (currentLesson.video_url || currentLesson.video_file_url) return 'video'
    if (currentLesson.pdf_file_url) return 'pdf'
    if (currentLesson.text_content) return 'text'
    return 'none'
  }

  const contentType = getContentType()

  const getContentIcon = () => {
    switch (contentType) {
      case 'video': return <Video className="w-5 h-5" />
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'text': return <Type className="w-5 h-5" />
      default: return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousLesson}
            disabled={currentLessonIndex === 0}
            className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Aula anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 text-center">
            {getContentIcon()}
            <div>
              <h3 className="font-semibold">{currentLesson.title}</h3>
              <p className="text-sm text-gray-400">
                Aula {currentLessonIndex + 1} de {lessons.length}
              </p>
            </div>
          </div>
          
          <button
            onClick={goToNextLesson}
            disabled={currentLessonIndex === lessons.length - 1}
            className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Próxima aula"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Player */}
      {contentType === 'video' && (
        <VideoPlayerSimple 
          lesson={currentLesson}
          enrollment={enrollment}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {contentType === 'pdf' && (
        <PDFPlayerSimple 
          lesson={currentLesson}
          enrollment={enrollment}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {contentType === 'text' && (
        <TextPlayerSimple 
          lesson={currentLesson}
          enrollment={enrollment}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {contentType === 'none' && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conteúdo não disponível</h3>
          <p className="text-gray-600">Esta aula não possui conteúdo associado</p>
        </div>
      )}
    </div>
  )
}