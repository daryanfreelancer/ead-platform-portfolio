'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { EvaluationInterface } from './evaluation-interface'
import { 
  Clock, 
  User, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  Award,
  Target,
  CheckCircle,
  Play,
  PlayCircle,
  Circle,
  Lock,
  Eye,
  FileText
} from 'lucide-react'

const supabase = createClient()

export function CourseContentEnhanced({ course, enrollment: initialEnrollment, onLessonSelect, currentLessonId, progressUpdateTrigger, user }) {
  const [expandedSection, setExpandedSection] = useState('lessons')
  const [lessons, setLessons] = useState([])
  const [lessonProgress, setLessonProgress] = useState({})
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrollment, setEnrollment] = useState(initialEnrollment)

  useEffect(() => {
    loadLessons()
    loadLessonProgress()
    loadEvaluations()
  }, [course.id])

  // Reload progress when triggered by progress updates
  useEffect(() => {
    if (progressUpdateTrigger > 0) {
      // Add a delay to ensure database update has been processed
      setTimeout(() => {
        loadLessonProgress()
        loadEnrollmentData()
      }, 500)
    }
  }, [progressUpdateTrigger])

  // Force re-render when currentLessonId changes
  useEffect(() => {
    // This ensures the UI updates immediately when lesson changes
    setExpandedSection('lessons')
  }, [currentLessonId])

  const loadLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index')
      
      if (error) throw error
      setLessons(data || [])
    } catch (error) {
      console.error('Error loading lessons:', error)
    }
  }

  const loadLessonProgress = async () => {
    try {
      const response = await fetch(`/api/lesson-progress?course_id=${course.id}`)
      if (response.ok) {
        const progress = await response.json()
        const progressMap = {}
        progress.forEach(p => {
          progressMap[p.lesson_id] = p
        })
        setLessonProgress(progressMap)
      }
    } catch (error) {
      console.error('Error loading lesson progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('course_id', course.id)
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Error loading evaluations:', error)
    }
  }

  const loadEnrollmentData = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', initialEnrollment.id)
        .single()

      if (error) throw error
      if (data) {
        setEnrollment(data)
      }
    } catch (error) {
      console.error('Error loading enrollment data:', error)
    }
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (duration) => {
    if (!duration) return 'N/A'
    if (duration < 60) return `${duration}min`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'text-green-600'
    if (progress >= 75) return 'text-blue-600'
    if (progress >= 50) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const isLessonCompleted = (lessonId) => {
    const progress = lessonProgress[lessonId]
    const isCompleted = progress?.progress_percentage >= 100 || !!progress?.completed_at
    // Log apenas para debug quando necessário
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
      console.log(`🎯 Lesson ${lessonId.substring(0, 8)}... completed: ${isCompleted}`)
    }
    return isCompleted
  }

  const getLessonProgress = (lessonId) => {
    return lessonProgress[lessonId]?.progress_percentage || 0
  }

  const getTotalDuration = () => {
    return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0)
  }

  const getCompletedLessons = () => {
    return lessons.filter(lesson => isLessonCompleted(lesson.id)).length
  }

  const canAccessLesson = (lesson, index) => {
    // Free preview lessons are always accessible
    if (lesson.is_free_preview) return true
    
    // First lesson is always accessible
    if (index === 0) return true
    
    // Check if previous lesson is completed
    const previousLesson = lessons[index - 1]
    return previousLesson ? isLessonCompleted(previousLesson.id) : false
  }

  const sections = [
    {
      id: 'lessons',
      title: `Aulas (${lessons.length})`,
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando aulas...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Este curso ainda não possui aulas.</p>
              <p className="text-sm">O professor está organizando o conteúdo.</p>
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(lesson.id)
              const progress = getLessonProgress(lesson.id)
              const canAccess = canAccessLesson(lesson, index)
              const isCurrentLesson = currentLessonId === lesson.id
              
              return (
                <div
                  key={lesson.id}
                  title={canAccess ? `Clique para assistir: ${lesson.title}` : 'Complete a aula anterior para desbloquear'}
                  className={`border rounded-lg p-4 transition-all duration-300 ${
                    isCurrentLesson 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300 shadow-md scale-[1.02]' 
                      : canAccess 
                        ? 'hover:bg-gray-50 hover:border-gray-300 cursor-pointer hover:shadow-sm hover:scale-[1.01] border-gray-300' 
                        : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (canAccess) {
                      console.log('🎯 Navigating to lesson:', lesson.id, lesson.title)
                      onLessonSelect?.(lesson.id)
                    } else {
                      console.log('🔒 Lesson access blocked:', lesson.id, lesson.title)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {!canAccess ? (
                          <Lock className="w-5 h-5 text-gray-400" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : isCurrentLesson ? (
                          <PlayCircle className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">
                            {index + 1}.
                          </span>
                          <h4 className={`font-medium ${
                            canAccess ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {lesson.title}
                          </h4>
                          {lesson.is_free_preview && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              <Eye className="w-3 h-3 inline mr-1" />
                              Preview
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDuration(lesson.duration)}
                          </div>
                          
                          {canAccess && !isCompleted && progress > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{progress}%</span>
                            </div>
                          )}
                        </div>
                        
                        {lesson.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                        
                        {!canAccess && index > 0 && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Complete a aula anterior para desbloquear
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {canAccess && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="p-2 rounded-full hover:bg-blue-100 transition-colors">
                          <Play className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )
    },
    {
      id: 'description',
      title: 'Descrição do Curso',
      icon: Target,
      content: (
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {course.description}
          </p>
        </div>
      )
    },
    {
      id: 'details',
      title: 'Detalhes',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Duração Total</p>
                <p className="text-sm text-gray-600">
                  {lessons.length > 0 ? formatDuration(getTotalDuration()) : formatDuration(course.duration)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Aulas</p>
                <p className="text-sm text-gray-600">
                  {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Instrutor</p>
                <p className="text-sm text-gray-600">{course.profiles?.full_name || 'Professor'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Data de Criação</p>
                <p className="text-sm text-gray-600">{formatDate(course.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'objectives',
      title: 'Objetivos de Aprendizado',
      icon: Award,
      content: (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">
              Compreender completamente o conteúdo apresentado no curso
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">
              Aplicar os conhecimentos adquiridos em situações práticas
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">
              Obter certificação de conclusão do curso
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">
              Desenvolver competências relacionadas ao tema abordado
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'evaluations',
      title: `Avaliações (${evaluations.length})`,
      icon: FileText,
      content: (
        <div>
          {user ? (
            <EvaluationInterface 
              course={course}
              enrollment={enrollment}
              user={user}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Faça login para acessar as avaliações.</p>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {course.title}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{course.profiles?.full_name || 'Professor'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              {lessons.length > 0 ? formatDuration(getTotalDuration()) : formatDuration(course.duration)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Matriculado em {formatDate(enrollment.enrolled_at)}</span>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {lessons.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900">
              Progresso do Curso
            </h3>
            <span className="text-sm text-blue-700">
              {getCompletedLessons()} de {lessons.length} aulas
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCompletedLessons() / lessons.length) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-blue-700">
            <span>{Math.round((getCompletedLessons() / lessons.length) * 100)}% concluído</span>
            <span>{lessons.length - getCompletedLessons()} aulas restantes</span>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          
          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Enrollment Information */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          Informações da Matrícula
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-green-900">Data de Matrícula</p>
            <p className="text-green-700">{formatDate(enrollment.enrolled_at)}</p>
          </div>
          <div>
            <p className="font-medium text-green-900">Progresso Atual</p>
            <p className="text-green-700">{enrollment.progress || 0}% concluído</p>
          </div>
          {enrollment.completed_at && (
            <div>
              <p className="font-medium text-green-900">Data de Conclusão</p>
              <p className="text-green-700">{formatDate(enrollment.completed_at)}</p>
            </div>
          )}
          <div>
            <p className="font-medium text-green-900">Status</p>
            <p className="text-green-700">
              {enrollment.completed_at ? 'Concluído' : 'Em andamento'}
            </p>
          </div>
        </div>
      </Card>

      {/* Study Tips */}
      {!enrollment.completed_at && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            💡 Dicas para Melhor Aproveitamento
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Assista todas as aulas em ordem para melhor compreensão</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Complete uma aula antes de prosseguir para a próxima</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Faça anotações dos pontos principais de cada aula</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Revise o conteúdo sempre que necessário</span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  )
}