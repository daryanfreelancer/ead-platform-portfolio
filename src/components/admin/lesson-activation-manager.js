'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import LessonActivationToggle from '@/components/admin/lesson-activation-toggle'
import { 
  BookOpen, 
  Play, 
  Clock, 
  User,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'

export default function LessonActivationManager({ initialLessons = [] }) {
  const [lessons, setLessons] = useState(initialLessons)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const [filterCourse, setFilterCourse] = useState('all')

  // Obter cursos únicos para filtro
  const uniqueCourses = useMemo(() => {
    const courses = lessons
      .map(lesson => lesson.course)
      .filter((course, index, self) => 
        course && self.findIndex(c => c?.id === course.id) === index
      )
    return courses.sort((a, b) => a?.title?.localeCompare(b?.title || '') || 0)
  }, [lessons])

  // Filtrar aulas
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesSearch = lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lesson.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && lesson.is_active !== false) ||
                           (filterStatus === 'inactive' && lesson.is_active === false)
      
      const matchesCourse = filterCourse === 'all' || lesson.course?.id === filterCourse

      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [lessons, searchTerm, filterStatus, filterCourse])

  // Estatísticas
  const stats = useMemo(() => {
    const total = lessons.length
    const active = lessons.filter(l => l.is_active !== false).length
    const inactive = lessons.filter(l => l.is_active === false).length
    
    return { total, active, inactive }
  }, [lessons])

  const handleLessonToggle = (lessonId, isActive) => {
    setLessons(lessons.map(lesson => 
      lesson.id === lessonId 
        ? { ...lesson, is_active: isActive }
        : lesson
    ))
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const getContentTypeIcon = (lesson) => {
    if (lesson.video_url) {
      return <Play className="w-4 h-4 text-blue-600" />
    }
    if (lesson.content_type === 'pdf') {
      return <BookOpen className="w-4 h-4 text-red-600" />
    }
    return <BookOpen className="w-4 h-4 text-gray-600" />
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Aulas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Aulas Ativas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Aulas Inativas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inactive}
              </p>
            </div>
            <EyeOff className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar aulas ou cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px]"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Aulas Ativas</option>
              <option value="inactive">Aulas Inativas</option>
            </select>
            
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px]"
            >
              <option value="all">Todos os Cursos</option>
              {uniqueCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Resultados */}
        <div className="text-sm text-gray-600 mb-4">
          Mostrando {filteredLessons.length} de {lessons.length} aulas
        </div>
      </Card>

      {/* Lista de Aulas */}
      <div className="space-y-4">
        {filteredLessons.map((lesson) => (
          <Card key={lesson.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* Ícone do tipo de conteúdo */}
              <div className="flex-shrink-0 mt-1">
                {getContentTypeIcon(lesson)}
              </div>

              {/* Conteúdo da aula */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Curso: {lesson.course?.title || 'Curso não encontrado'}
                    </p>
                  </div>
                  
                  {/* Status visual */}
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium min-h-[44px] ${
                    lesson.is_active !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {lesson.is_active !== false ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Ativa
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Inativa
                      </>
                    )}
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>
                      Professor: {lesson.course?.teacher?.full_name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      Duração: {lesson.duration ? `${lesson.duration} min` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>
                      Posição: {lesson.order_index || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>
                      Módulo: {lesson.module?.title || 'Sem módulo'}
                    </span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-xs text-gray-500">
                    Criado em: {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  
                  <LessonActivationToggle
                    lesson={lesson}
                    onToggle={handleLessonToggle}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {filteredLessons.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma aula encontrada
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' || filterCourse !== 'all'
              ? 'Tente ajustar os filtros para encontrar aulas.'
              : 'Não há aulas cadastradas no sistema.'}
          </p>
        </Card>
      )}
    </div>
  )
}