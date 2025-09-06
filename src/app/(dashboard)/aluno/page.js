import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Link from 'next/link'
import EnrollmentList from '@/components/student/enrollment-list'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Buscar perfil do usuário com tratamento de erro
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Se não encontrar perfil, criar um básico
  if (profileError || !profile) {
    console.error('Erro ao buscar perfil:', profileError)
    // Pode redirecionar para completar perfil ou usar dados básicos
  }

  // Buscar matrículas do usuário (pode retornar array vazio)
  const { data: enrollments, error: enrollmentsError } = await supabase
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

  if (enrollmentsError) {
    console.error('Erro ao buscar matrículas:', enrollmentsError)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📚</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cursos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments?.filter(e => !e.completed_at).length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments?.filter(e => e.completed_at).length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments?.filter(e => e.completed_at).length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h4 className="font-semibold mb-2">Explorar Cursos</h4>
              <p className="text-sm text-gray-600 mb-4">
                Descubra novos cursos disponíveis
              </p>
              <Link href="/cursos">
                <Button className="w-full">
                  Ver Cursos
                </Button>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="font-semibold mb-2">Meus Certificados</h4>
              <p className="text-sm text-gray-600 mb-4">
                Visualizar e baixar certificados
              </p>
              <Link href="/certificados">
                <Button variant="outline" className="w-full">
                  Ver Certificados
                </Button>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h4 className="font-semibold mb-2">Meu Perfil</h4>
              <p className="text-sm text-gray-600 mb-4">
                Atualizar informações pessoais
              </p>
              <Link href="/perfil">
                <Button variant="outline" className="w-full">
                  Editar Perfil
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Current Courses */}
        <EnrollmentList initialEnrollments={enrollments || []} />

        {/* Profile Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Informações do Perfil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nome Completo</label>
              <p className="text-gray-900">{profile?.full_name || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{user.email}</p>
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
          
        </Card>
    </div>
  )
}
