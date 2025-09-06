'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { 
  Clock, 
  User, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  Award,
  Target,
  CheckCircle
} from 'lucide-react'

const supabase = createClient()

export function CourseContent({ course, enrollment: initialEnrollment, progressUpdateTrigger }) {
  const [expandedSection, setExpandedSection] = useState('description')
  const [enrollment, setEnrollment] = useState(initialEnrollment)

  // Reload enrollment data when progress is updated
  useEffect(() => {
    if (progressUpdateTrigger > 0) {
      setTimeout(() => {
        loadEnrollmentData()
      }, 500)
    }
  }, [progressUpdateTrigger])

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

  const sections = [
    {
      id: 'description',
      title: 'Descrição do Curso',
      icon: BookOpen,
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
                <p className="font-medium text-gray-900">Duração</p>
                <p className="text-sm text-gray-600">{formatDuration(course.duration)}</p>
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
            
            <div className="flex items-center space-x-3">
              <CheckCircle className={`w-5 h-5 ${getProgressColor(enrollment.progress || 0)}`} />
              <div>
                <p className="font-medium text-gray-900">Seu Progresso</p>
                <p className={`text-sm ${getProgressColor(enrollment.progress || 0)}`}>
                  {enrollment.progress || 0}% concluído
                </p>
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
            <span>{formatDuration(course.duration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Matriculado em {formatDate(enrollment.enrolled_at)}</span>
          </div>
        </div>
      </div>

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

      {/* Informações de Matrícula */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Informações da Matrícula
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-900">Data de Matrícula</p>
            <p className="text-blue-700">{formatDate(enrollment.enrolled_at)}</p>
          </div>
          <div>
            <p className="font-medium text-blue-900">Progresso Atual</p>
            <p className="text-blue-700">{enrollment.progress || 0}% concluído</p>
          </div>
          {enrollment.completed_at && (
            <div>
              <p className="font-medium text-blue-900">Data de Conclusão</p>
              <p className="text-blue-700">{formatDate(enrollment.completed_at)}</p>
            </div>
          )}
          <div>
            <p className="font-medium text-blue-900">Status</p>
            <p className="text-blue-700">
              {enrollment.completed_at ? 'Concluído' : 'Em andamento'}
            </p>
          </div>
        </div>
      </Card>

      {/* Dicas de Estudo */}
      {!enrollment.completed_at && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            💡 Dicas para Melhor Aproveitamento
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Assista o vídeo completo para garantir 100% de progresso</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Faça anotações dos pontos principais durante o curso</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Revise o conteúdo sempre que necessário</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Baixe seu certificado após completar o curso</span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  )
}