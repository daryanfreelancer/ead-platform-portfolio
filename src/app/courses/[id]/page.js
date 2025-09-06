import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { EnrollButton } from '@/components/courses/enroll-button'
import { StudentOnly } from '@/components/auth/role-guard'
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar,
  Play,
  CheckCircle,
  Award,
  ArrowLeft,
  Star,
  User
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

  // Verificar role do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/entrar')
  }

  // Buscar curso
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!teacher_id (
        id,
        full_name,
        avatar_url
      ),
      enrollments (
        id,
        student_id,
        progress,
        enrolled_at,
        completed_at
      )
    `)
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (error || !course) {
    redirect('/cursos')
  }

  // Verificar se o usuário está matriculado
  const userEnrollment = course.enrollments?.find(e => e.student_id === user.id)
  const isEnrolled = !!userEnrollment
  const totalEnrollments = course.enrollments?.length || 0
  const completedEnrollments = course.enrollments?.filter(e => e.completed_at).length || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <StudentOnly showUnauthorized={true}>
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/cursos"
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header do Curso */}
            <div>
              <div className="mb-4">
                {isEnrolled && (
                  <div className="mb-4">
                    {userEnrollment.completed_at ? (
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Curso Concluído
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          <Play className="w-4 h-4 mr-2" />
                          Matriculado - {userEnrollment.progress || 0}% concluído
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${userEnrollment.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {course.title}
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-gray-600 mb-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base truncate">Por {course.profiles?.full_name || 'Professor'}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'Duração não definida'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{totalEnrollments} aluno{totalEnrollments !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Thumbnail/Vídeo */}
            <Card className="overflow-hidden">
              <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-400 to-blue-600">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-white" />
                  </div>
                )}
                
                {/* Overlay de play para vídeo */}
                {isEnrolled && course.video_url && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <Link href={`/courses/${course.id}/learn`}>
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-6 hover:bg-opacity-30 transition-all">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Descrição */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sobre o Curso
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </Card>

            {/* Professor */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Instrutor
              </h2>
              <div className="flex items-center space-x-4">
                {course.profiles?.avatar_url ? (
                  <img
                    src={course.profiles.avatar_url}
                    alt="Professor"
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {course.profiles?.full_name || 'Professor'}
                  </h3>
                  <p className="text-gray-600">
                    Instrutor certificado
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card de Matrícula */}
            <Card className="p-6">
              <div className="space-y-4">
                {isEnrolled ? (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Você está matriculado!</p>
                      <p className="text-sm text-gray-600">
                        Matriculado em {new Date(userEnrollment.enrolled_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <Link href={`/courses/${course.id}/learn`} className="block">
                      <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                        <Play className="w-5 h-5" />
                        {userEnrollment.completed_at ? 'Revisar Curso' : 'Continuar Aprendendo'}
                      </button>
                    </Link>
                    
                    {userEnrollment.completed_at && (
                      <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                        <Award className="w-5 h-5" />
                        Baixar Certificado
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Comece a aprender!</p>
                      <p className="text-sm text-gray-600">
                        Matricule-se gratuitamente
                      </p>
                    </div>
                    
                    <EnrollButton 
                      courseId={course.id}
                      userId={user.id}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Estatísticas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas do Curso
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Alunos</span>
                  <span className="font-semibold text-gray-900">{totalEnrollments}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Concluíram</span>
                  <span className="font-semibold text-gray-900">{completedEnrollments}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Conclusão</span>
                  <span className="font-semibold text-gray-900">
                    {totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de Conteúdo</span>
                  <span className="font-semibold text-gray-900">
                    {course.video_type === 'upload' ? 'Vídeo próprio' : 'URL externa'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Informações Técnicas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    Duração: {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'Não definida'}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    Acesso vitalício
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Award className="w-4 h-4 mr-2" />
                  <span>
                    Certificado de conclusão
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>
                    Suporte da comunidade
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </StudentOnly>
    </div>
  )
}