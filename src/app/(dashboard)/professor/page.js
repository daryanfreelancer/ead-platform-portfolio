import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { TeacherOnly } from '@/components/auth/role-guard'
import { 
  BookOpen, 
  Users, 
  PlusCircle, 
  Calendar, 
  TrendingUp, 
  Clock,
  Eye,
  Edit,
  MoreVertical,
  Award
} from 'lucide-react'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é professor ou admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    redirect('/aluno')
  }

  // Buscar cursos do professor
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      enrollments (
        id,
        student_id,
        progress,
        completed_at,
        profiles (
          full_name
        )
      )
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  // Calcular estatísticas
  const totalCourses = courses?.length || 0
  const publishedCourses = courses?.filter(c => c.status === 'published').length || 0
  const pendingCourses = courses?.filter(c => c.status === 'pending').length || 0
  const totalEnrollments = courses?.reduce((acc, course) => acc + (course.enrollments?.length || 0), 0) || 0

  const getStatusBadge = (status) => {
    const statusConfig = {
      'published': { label: 'Publicado', color: 'bg-green-100 text-green-800 border-green-200' },
      'pending': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'draft': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TeacherOnly showUnauthorized={true}>
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard do Professor
            </h1>
            <p className="text-gray-600">
              Bem-vindo, {profile?.full_name || 'Professor'}! Gerencie seus cursos e acompanhe o progresso dos alunos.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link href="/professor/avaliacoes">
              <Button variant="outline" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Minhas Avaliações
              </Button>
            </Link>
            <Link href="/professor/cursos/criar">
              <Button className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Criar Novo Curso
              </Button>
            </Link>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total de Cursos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCourses}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Cursos Publicados
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {publishedCourses}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Aguardando Aprovação
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingCourses}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total de Alunos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalEnrollments}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Lista de Cursos */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Meus Cursos
            </h2>
            {totalCourses === 0 && (
              <Link href="/professor/cursos/criar">
                <Button size="sm" className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Criar Primeiro Curso
                </Button>
              </Link>
            )}
          </div>
          
          {totalCourses > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alunos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duração
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses?.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-16 h-12 object-cover rounded mr-4"
                              />
                            ) : (
                              <div className="w-16 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded mr-4 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {course.title}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {course.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(course.status)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.enrollments?.length || 0}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'N/A'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(course.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/professor/cursos/${course.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/professor/cursos/${course.id}/editar`}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {courses?.map((course) => (
                  <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-16 h-12 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex-shrink-0 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{course.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {getStatusBadge(course.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Alunos:</span>
                        <span className="ml-1 text-gray-900">{course.enrollments?.length || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Duração:</span>
                        <span className="ml-1 text-gray-900">
                          {course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}min` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Criado em:</span>
                        <span className="ml-1 text-gray-900">{new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/professor/cursos/${course.id}`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-900 min-h-[44px]"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Link>
                        <Link
                          href={`/professor/cursos/${course.id}/editar`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-900 min-h-[44px]"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum curso criado ainda
              </h3>
              <p className="text-gray-500 mb-6">
                Comece criando seu primeiro curso para compartilhar conhecimento com os alunos.
              </p>
            </div>
          )}
        </Card>
      </TeacherOnly>
    </div>
  )
}