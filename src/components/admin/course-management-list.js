'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { CourseApprovalButton } from '@/components/admin/course-approval-button'
import { useDeleteOperations } from '@/hooks/use-delete-operations'
import CourseActivationToggle from '@/components/admin/course-activation-toggle'
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar,
  Eye,
  Check,
  X,
  AlertCircle,
  User,
  Trash2,
  EyeOff,
  Power,
  DollarSign,
  Gift
} from 'lucide-react'

export default function CourseManagementList({ initialCourses = [] }) {
  const router = useRouter()
  const [courses, setCourses] = useState(initialCourses)
  const { deleteCourse, loading, error } = useDeleteOperations()

  // Identificar se é um curso herdado pelo sistema
  const isSystemInherited = (course) => {
    return course.teacher_id === '00000000-0000-0000-0000-000000000000' ||
           course.profiles?.email === 'system@eduplatform.internal'
  }

  const handleViewCourse = (courseId) => {
    router.push(`/courses/${courseId}`)
  }

  const handleDeleteCourse = async (course) => {
    const enrollmentCount = course.enrollments?.length || 0
    
    if (window.confirm(
      `Tem certeza que deseja deletar o curso "${course.title}"?\n\n` +
      `Esta ação é irreversível e irá deletar:\n` +
      `• O curso e toda sua informação\n` +
      `• ${enrollmentCount} matrícula${enrollmentCount !== 1 ? 's' : ''}\n` +
      `• Todos os certificados relacionados\n` +
      `• Arquivos (thumbnail e vídeo)\n\n` +
      `Os alunos matriculados perderão acesso ao curso.`
    )) {
      const result = await deleteCourse(course.id, course)
      if (result.success) {
        setCourses(courses.filter(c => c.id !== course.id))
        alert('Curso deletado com sucesso!')
      } else {
        alert('Erro ao deletar curso: ' + result.error)
      }
    }
  }

  const handleCourseActivationToggle = (courseId, isActive) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? { ...course, is_active: isActive }
        : course
    ))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'published': { 
        label: 'Publicado', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <Check className="w-4 h-4" />
      },
      'pending': { 
        label: 'Aguardando Aprovação', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-4 h-4" />
      },
      'draft': { 
        label: 'Rascunho', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <AlertCircle className="w-4 h-4" />
      }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${config.color}`}>
        {config.icon}
        <span className="ml-2">{config.label}</span>
      </span>
    )
  }

  const getPriceBadge = (course) => {
    const isFree = course.is_free || !course.price || course.price <= 0
    
    if (isFree) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
          <Gift className="w-4 h-4" />
          <span className="ml-2">GRATUITO</span>
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
          <DollarSign className="w-4 h-4" />
          <span className="ml-2">R$ {course.price?.toFixed(2) || '0,00'}</span>
        </span>
      )
    }
  }

  const CourseCard = ({ course, showActions = false }) => (
    <Card key={course.id} className="p-6">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-24 h-18 object-cover rounded-lg"
            />
          ) : (
            <div className="w-24 h-18 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 min-w-0">
              {course.title}
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              {getPriceBadge(course)}
              {getStatusBadge(course.status)}
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {course.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center min-w-0">
              <User className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">
                {isSystemInherited(course) ? (
                  <span className="text-orange-600 font-semibold">[Sistema] Herdado</span>
                ) : (
                  course.profiles?.full_name || 'Professor'
                )}
              </span>
            </div>
            
            <div className="flex items-center min-w-0">
              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center min-w-0">
              <Users className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">{course.enrollments?.length || 0} aluno{(course.enrollments?.length || 0) !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex items-center min-w-0">
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">{new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-full overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              <button 
                onClick={() => handleViewCourse(course.id)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 transition-colors px-3 py-2 min-h-[44px] hover:bg-blue-50 rounded-lg flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
                <span className="whitespace-nowrap">Visualizar</span>
              </button>

              {showActions && course.status === 'pending' && (
                <div className="flex-shrink-0">
                  <CourseApprovalButton courseId={course.id} />
                </div>
              )}

              <button 
                onClick={() => handleDeleteCourse(course)}
                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 px-3 py-2 min-h-[44px] hover:bg-red-50 rounded-lg flex-shrink-0"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                <span className="whitespace-nowrap">Deletar</span>
              </button>
            </div>

            {/* Toggle de ativação */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <CourseActivationToggle
                course={course}
                onToggle={handleCourseActivationToggle}
                disabled={loading}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  // Separar cursos por status
  const pendingCourses = courses.filter(c => c.status === 'pending')
  const publishedCourses = courses.filter(c => c.status === 'published')
  const draftCourses = courses.filter(c => c.status === 'draft')
  const activeCourses = courses.filter(c => c.is_active !== false)
  const inactiveCourses = courses.filter(c => c.is_active === false)
  
  // Separar cursos por preço
  const freeCourses = courses.filter(c => c.is_free || !c.price || c.price <= 0)
  const paidCourses = courses.filter(c => !c.is_free && c.price > 0)

  return (
    <div>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Cursos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Aguardando Aprovação
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingCourses.length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Publicados
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {publishedCourses.length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Cursos Ativos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCourses.length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Cursos Inativos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {inactiveCourses.length}
              </p>
            </div>
            <EyeOff className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Cursos Gratuitos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {freeCourses.length}
              </p>
            </div>
            <Gift className="w-8 h-8 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Cursos Pagos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {paidCourses.length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Cursos Pendentes de Aprovação */}
      {pendingCourses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Cursos Aguardando Aprovação ({pendingCourses.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingCourses.map((course) => (
              <CourseCard key={course.id} course={course} showActions={true} />
            ))}
          </div>
        </div>
      )}

      {/* Cursos Publicados */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Check className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Cursos Publicados ({publishedCourses.length})
          </h2>
        </div>
        {publishedCourses.length > 0 ? (
          <div className="space-y-4">
            {publishedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum curso publicado ainda</p>
          </Card>
        )}
      </div>

      {/* Rascunhos */}
      {draftCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Rascunhos ({draftCourses.length})
            </h2>
          </div>
          <div className="space-y-4">
            {draftCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há cursos */}
      {courses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum curso encontrado
          </h3>
          <p className="text-gray-600">
            Os professores ainda não criaram nenhum curso na plataforma.
          </p>
        </Card>
      )}
    </div>
  )
}