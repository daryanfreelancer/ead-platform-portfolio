'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'

export default function TeacherDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profile)

        // Verificar se é professor
        if (profile?.role !== 'teacher') {
          router.push('/aluno')
          return
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

        setCourses(courses || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalStudents = courses.reduce((acc, course) => 
    acc + (course.enrollments?.length || 0), 0
  )

  const completedEnrollments = courses.reduce((acc, course) => 
    acc + (course.enrollments?.filter(e => e.completed_at).length || 0), 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-header Dashboard */}
      <div className="bg-green-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <span className="text-sm font-medium">👨‍🏫 Dashboard Professor</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Painel do Professor 👨‍🏫
          </h2>
          <p className="text-gray-600 mt-2">
            Gerencie seus cursos e acompanhe o progresso dos seus alunos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">📚</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Meus Cursos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Alunos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalStudents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedEnrollments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa Sucesso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalStudents > 0 ? Math.round((completedEnrollments / totalStudents) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">➕</span>
                </div>
                <h4 className="font-semibold mb-2">Criar Novo Curso</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione um novo curso ao catálogo
                </p>
                <Button className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="font-semibold mb-2">Ver Relatórios</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Relatórios de desempenho dos alunos
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h4 className="font-semibold mb-2">Mensagens</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Comunicação com os alunos
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de Cursos */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Meus Cursos
          </h3>
          
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {course.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {course.description?.substring(0, 100)}...
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {course.enrollments?.length || 0}
                        </p>
                        <p className="text-xs text-gray-600">Matriculados</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {course.enrollments?.filter(e => e.completed_at).length || 0}
                        </p>
                        <p className="text-xs text-gray-600">Concluíram</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {course.enrollments?.length > 0 
                            ? Math.round(
                                course.enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / 
                                course.enrollments.length
                              )
                            : 0
                          }%
                        </p>
                        <p className="text-xs text-gray-600">Progresso Médio</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1" disabled>
                        Editar
                      </Button>
                      <Button variant="secondary" size="sm" className="flex-1" disabled>
                        Ver Alunos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h4 className="text-lg font-semibold mb-2">
                  Ainda não há cursos criados
                </h4>
                <p className="text-gray-600 mb-4">
                  Comece criando seu primeiro curso para os alunos!
                </p>
                <Button disabled>
                  Criar Primeiro Curso
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}