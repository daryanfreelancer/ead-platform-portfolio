'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCertificate } from '@/hooks/use-certificate'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  Award, 
  User, 
  ArrowLeft, 
  BookOpen,
  Download,
  Share2
} from 'lucide-react'

const supabase = createClient()

export function ProgressTracker({ course, enrollment, user, progressUpdateTrigger, onLessonSelect, currentLessonId }) {
  const [currentProgress, setCurrentProgress] = useState(enrollment.progress || 0)
  const [isCompleted, setIsCompleted] = useState(!!enrollment.completed_at)
  const [lessons, setLessons] = useState([])
  const [lessonProgress, setLessonProgress] = useState({})
  const [showCertificateMessage, setShowCertificateMessage] = useState(false)
  const { generateCertificate, loading: certLoading, error: certError } = useCertificate()

  useEffect(() => {
    loadLessonsAndProgress()
  }, [course.id])

  // Reload progress when triggered by progress updates
  useEffect(() => {
    if (progressUpdateTrigger > 0) {
      setTimeout(() => {
        loadLessonsAndProgress()
      }, 500)
    }
  }, [progressUpdateTrigger])

  useEffect(() => {
    // Escutar mudanças no progresso em tempo real
    const channel = supabase
      .channel('progress-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'enrollments',
        filter: `id=eq.${enrollment.id}`
      }, (payload) => {
        setCurrentProgress(payload.new.progress || 0)
        
        if (payload.new.completed_at && !isCompleted) {
          setIsCompleted(true)
          setShowCertificateMessage(true)
          setTimeout(() => setShowCertificateMessage(false), 5000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enrollment.id, isCompleted])

  const loadLessonsAndProgress = async () => {
    try {
      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index')
      
      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

      // Load lesson progress
      const response = await fetch(`/api/lesson-progress?course_id=${course.id}`)
      if (response.ok) {
        const progress = await response.json()
        const progressMap = {}
        progress.forEach(p => {
          progressMap[p.lesson_id] = p
        })
        setLessonProgress(progressMap)
      }

      // Update overall progress from enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('progress, completed_at')
        .eq('id', enrollment.id)
        .single()
      
      if (enrollmentError) throw enrollmentError
      
      if (enrollmentData) {
        // Log de progresso apenas em desenvolvimento ocasionalmente
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
          console.log('📊 Progress updated:', enrollmentData.progress || 0, 'Complete:', !!enrollmentData.completed_at)
        }
        setCurrentProgress(enrollmentData.progress || 0)
        setIsCompleted(!!enrollmentData.completed_at)
      }
    } catch (error) {
      console.error('Error loading lessons and progress:', error)
    }
  }

  const handleGenerateCertificate = async () => {
    try {
      const result = await generateCertificate(enrollment.id)
      if (result.success) {
        alert('Certificado gerado e baixado com sucesso!')
      } else {
        alert(`Erro ao gerar certificado: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao gerar certificado:', error)
      alert('Erro inesperado ao gerar certificado')
    }
  }

  const shareProgress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Progresso no curso: ${course.title}`,
          text: `Estou ${currentProgress}% concluído no curso "${course.title}" na plataforma EduPlatform!`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Compartilhamento cancelado')
      }
    } else {
      // Fallback para copiar para clipboard
      navigator.clipboard.writeText(
        `Estou ${currentProgress}% concluído no curso "${course.title}" na plataforma EduPlatform! ${window.location.href}`
      )
      alert('Link copiado para a área de transferência!')
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <Link 
          href={`/courses/${course.id}`}
          className="flex items-center text-blue-600 hover:text-blue-800 text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao curso
        </Link>
        
        <h1 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h1>
        
        <div className="flex items-center text-gray-600 text-sm">
          <User className="w-4 h-4 mr-1" />
          <span>{course.profiles?.full_name || 'Professor'}</span>
        </div>
      </div>

      {/* Progresso */}
      <Card className="p-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - currentProgress / 100)}`}
                className={isCompleted ? "text-green-500" : "text-blue-500"}
                style={{
                  transition: 'stroke-dashoffset 0.5s ease-in-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">
                {currentProgress}%
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-1">
            {isCompleted ? 'Curso Concluído!' : 'Progresso do Curso'}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {isCompleted 
              ? 'Parabéns! Você completou este curso.' 
              : `${currentProgress}% do curso assistido`
            }
          </p>

          {isCompleted && (
            <div className="space-y-2">
              <Button 
                onClick={handleGenerateCertificate}
                disabled={certLoading}
                className="w-full flex items-center justify-center gap-2"
              >
                {certLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Baixar Certificado
                  </>
                )}
              </Button>
              
              <Button 
                variant="secondary"
                onClick={shareProgress}
                className="w-full flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Mensagem de conclusão */}
      {showCertificateMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-green-900">
                  Parabéns!
                </h4>
                <p className="text-sm text-green-700">
                  Você concluiu o curso! Seu certificado está disponível.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Progresso das Aulas */}
      {lessons.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Progresso das Aulas
          </h3>
          
          <div className="space-y-2">
            {lessons.map((lesson, index) => {
              const progressData = lessonProgress[lesson.id]
              const progress = progressData?.progress_percentage || 0
              const isCompleted = progress >= 100 || !!progressData?.completed_at
              
              const isCurrentLesson = currentLessonId === lesson.id
              const canAccessLesson = index === 0 || lessons.slice(0, index).every(prev => {
                const prevProgressData = lessonProgress[prev.id]
                const prevProgress = prevProgressData?.progress_percentage || 0
                return prevProgress >= 100 || !!prevProgressData?.completed_at
              })
              
              return (
                <div 
                  key={lesson.id} 
                  className={`flex items-center justify-between gap-3 py-1 rounded-md transition-colors ${
                    isCurrentLesson 
                      ? 'bg-blue-50 border border-blue-200 px-2 py-2' 
                      : canAccessLesson 
                        ? 'hover:bg-gray-50 cursor-pointer px-2 py-1' 
                        : 'opacity-60 px-2 py-1'
                  }`}
                  onClick={() => canAccessLesson && onLessonSelect?.(lesson.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs text-gray-500 flex-shrink-0">{index + 1}.</span>
                    <span className={`text-sm truncate ${
                      isCurrentLesson ? 'text-blue-900 font-medium' : 'text-gray-700'
                    }`}>
                      {lesson.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : progress > 0 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-200 relative">
                        <div 
                          className="absolute inset-0 rounded-full bg-blue-500"
                          style={{ clipPath: `polygon(50% 50%, 50% 0%, ${50 + (progress/100) * 50}% 0%, ${50 + (progress/100) * 50}% 100%, 50% 100%)` }}
                        />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                    )}
                    <span className="text-xs text-gray-500 min-w-[3ch] text-right">{progress}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Informações do Curso */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Informações do Curso
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Duração</span>
            <span className="font-medium">
              {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Matrícula</span>
            <span className="font-medium">
              {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          {isCompleted && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Conclusão</span>
              <span className="font-medium text-green-600">
                {new Date(enrollment.completed_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Certificado</span>
            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
              {isCompleted ? 'Disponível' : 'Pendente'}
            </span>
          </div>
        </div>
      </Card>

      {/* Ações Rápidas */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Ações Rápidas
        </h3>
        
        <div className="space-y-2">
          <Link href="/courses" className="block">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              Explorar Mais Cursos
            </Button>
          </Link>
          
          <Link href="/profile" className="block">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Ver Meu Perfil
            </Button>
          </Link>
        </div>
      </Card>

      {/* Estatísticas Pessoais */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Suas Estatísticas
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {currentProgress}%
            </div>
            <div className="text-xs text-gray-600">
              Progresso
            </div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-600">
              {isCompleted ? '1' : '0'}
            </div>
            <div className="text-xs text-gray-600">
              Concluído
            </div>
          </div>
        </div>
      </Card>

      {/* Dicas de Aprendizado */}
      {!isCompleted && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 Dica de Aprendizado
          </h3>
          <p className="text-sm text-blue-700">
            Assista aos vídeos completos, e leia todo o material, para absorver melhor o conteúdo.
          </p>
        </Card>
      )}
    </div>
  )
}