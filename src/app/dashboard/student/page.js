'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'

export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
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

        // Buscar matrículas do usuário
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            *,
            courses (
              id,
              title,
              description,
              thumbnail_url
            )
          `)
          .eq('student_id', user.id)

        setEnrollments(enrollments || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
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
    return null // Vai redirecionar para login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-header Dashboard */}
      <div className="bg-blue-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <span className="text-sm font-medium">📊 Dashboard Estudante</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {profile?.full_name || 'Estudante'}! 👋
          </h2>
          <p className="text-gray-600 mt-2">
            Este é seu painel de estudos. Aqui você pode acompanhar seu progresso e acessar seus cursos.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">📚</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cursos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => !e.completed_at).length}
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
                    <span className="text-green-600">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.completed_at).length}
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
                    <span className="text-purple-600">🏆</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Certificados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrollments.filter(e => e.certificate_url).length}
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
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="font-semibold mb-2">Explorar Cursos</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Descubra novos cursos disponíveis
                </p>
                <Button className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h4 className="font-semibold mb-2">Meus Certificados</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Visualizar e baixar certificados
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/consulta-certificados', '_blank')}
                >
                  Consultar
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h4 className="font-semibold mb-2">Meu Perfil</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Atualizar informações pessoais
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Courses */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Meus Cursos
          </h3>
          
          {enrollments && enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-gray-500">📚</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">
                      {enrollment.courses?.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      {enrollment.courses?.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progresso</span>
                        <span>{enrollment.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    {enrollment.completed_at ? (
                      <Button variant="outline" className="w-full" disabled>
                        ✅ Concluído
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        Continuar Estudando
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">📖</div>
                <h4 className="text-lg font-semibold mb-2">
                  Nenhum curso encontrado
                </h4>
                <p className="text-gray-600 mb-4">
                  Você ainda não está matriculado em nenhum curso. Explore nosso catálogo!
                </p>
                <Button disabled>
                  Explorar Cursos (Em breve)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Informações do Perfil</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                <p className="text-gray-900">{profile?.full_name || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">CPF</label>
                <p className="text-gray-900">{profile?.cpf || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Conta</label>
                <p className="text-gray-900 capitalize">{profile?.role || 'Estudante'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}