import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { TeacherOnly } from '@/components/auth/role-guard'
import { 
  BookOpen, 
  Users, 
  Edit, 
  Calendar, 
  Clock,
  Play,
  Download,
  Eye,
  TrendingUp,
  Award
} from 'lucide-react'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function CourseDetailsPage({ params }) {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é professor ou admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    redirect('/aluno')
  }

  // Buscar curso com enrollments
  let course = null
  try {
    let query = supabase
      .from('courses')
      .select(`
        *,
        enrollments (
          id,
          student_id,
          progress,
          enrolled_at,
          completed_at,
          profiles!student_id (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', params.id)

    // Apenas filtrar por teacher_id se não for admin
    if (profile.role !== 'admin') {
      query = query.eq('teacher_id', user.id)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Erro ao buscar curso:', error)
      redirect('/professor')
    }

    course = data
  } catch (error) {
    console.error('Erro na query do curso:', error)
    redirect('/professor')
  }

  if (!course) {
    redirect('/professor')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'published': { label: 'Publicado', color: 'bg-green-100 text-green-800 border-green-200', icon: '✅' },
      'pending': { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
      'draft': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '📝' }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${config.color}`}>
        <span className="mr-2">{config.icon}</span>
        {config.label}
      </span>
    )
  }

  // Verificar e validar dados dos enrollments
  const enrollments = Array.isArray(course.enrollments) ? course.enrollments : []
  const completedStudents = enrollments.filter(e => e && e.completed_at).length
  const averageProgress = enrollments.length > 0 
    ? enrollments.reduce((acc, e) => acc + (e && typeof e.progress === 'number' ? e.progress : 0), 0) / enrollments.length 
    : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TeacherOnly showUnauthorized={true}>
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/teacher"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Voltar aos cursos
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.title}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              {getStatusBadge(course.status)}
              <span className="text-gray-500">
                Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link href={`/teacher/courses/${course.id}/edit`}>
              <Button variant="secondary" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar Curso
              </Button>
            </Link>
            {course.status === 'published' && (
              <Link href={`/courses/${course.id}`}>
                <Button className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver como Aluno
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Curso */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descrição e Mídia */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações do Curso
              </h2>
              
              <div className="space-y-6">
                {course.thumbnail_url && (
                  <div>
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Duração</h4>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'Não definida'}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Tipo de Conteúdo</h4>
                    <div className="flex items-center text-gray-600">
                      <Play className="w-4 h-4 mr-2" />
                      {course.video_type === 'upload' ? 'Vídeo próprio' : 'URL externa'}
                    </div>
                  </div>
                </div>

                {course.video_url && course.video_type === 'url' && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">URL do Vídeo</h4>
                    <a 
                      href={course.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {course.video_url}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Lista de Alunos Matriculados */}
            <Card className="p-6" id="enrolled-students">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Alunos Matriculados ({enrollments.length})
              </h2>
              
              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {enrollment.profiles?.avatar_url ? (
                          <img
                            src={enrollment.profiles.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {enrollment.profiles?.full_name || 'Nome não informado'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Matriculado em {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {enrollment.progress || 0}%
                          </span>
                        </div>
                        {enrollment.completed_at && (
                          <div className="flex items-center text-green-600 text-sm">
                            <Award className="w-4 h-4 mr-1" />
                            Concluído
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Nenhum aluno matriculado ainda
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Estatísticas */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Estatísticas
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">Total de Alunos</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {enrollments.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-700">Concluíram</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {completedStudents}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-gray-700">Progresso Médio</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {averageProgress.toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-gray-700">Taxa de Conclusão</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {enrollments.length > 0 ? ((completedStudents / enrollments.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Ações Rápidas */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ações Rápidas
              </h2>
              
              <div className="space-y-3">
                <Link href={`/teacher/courses/${course.id}/edit`} className="block">
                  <Button variant="secondary" className="w-full flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar Curso
                  </Button>
                </Link>
                
                {course.status === 'published' && (
                  <>
                    <Button 
                      variant="secondary" 
                      className="w-full flex items-center gap-2"
                      onClick={() => {
                        // TODO: Implementar exportação de relatório
                        alert('Funcionalidade de exportação de relatório será implementada em breve!')
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Exportar Relatório
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      className="w-full flex items-center gap-2"
                      onClick={() => {
                        // Scroll para a seção de alunos matriculados
                        const enrollmentsSection = document.querySelector('#enrolled-students')
                        if (enrollmentsSection) {
                          enrollmentsSection.scrollIntoView({ behavior: 'smooth' })
                        } else if (enrollments.length === 0) {
                          alert('Nenhum aluno matriculado neste curso ainda.')
                        }
                      }}
                    >
                      <Users className="w-4 h-4" />
                      Gerenciar Alunos
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </TeacherOnly>
    </div>
  )
}