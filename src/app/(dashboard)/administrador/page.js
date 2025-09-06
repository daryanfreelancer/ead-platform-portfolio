import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users, BookOpen, Award, Activity, HardDrive, Shield, Building2, GraduationCap, FileText, CreditCard, Tags } from 'lucide-react'
import SieApiControl from '@/components/admin/sie-api-control'
import { formatInTimeZone } from 'date-fns-tz'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é admin
  console.log('🏠 ADMIN PAGE SERVER - User ID:', user.id.substring(0, 8) + '...')
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('🏠 ADMIN PAGE SERVER - Profile:', profile)
  console.log('🏠 ADMIN PAGE SERVER - Profile Error:', profileError)
  console.log('🏠 ADMIN PAGE SERVER - Role:', profile?.role)

  if (!profile || profile.role !== 'admin') {
    console.log('🏠 ADMIN PAGE SERVER - REDIRECTING to /aluno - Role:', profile?.role)
    redirect('/aluno')
  }
  
  console.log('🏠 ADMIN PAGE SERVER - ACCESS GRANTED - Role:', profile.role)

  // Buscar estatísticas da plataforma
  const [
    usersResult,
    coursesResult,
    enrollmentsResult,
    certificatesResult
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('legacy_certificates').select('*', { count: 'exact', head: true })
  ])

  const totalUsers = usersResult.count || 0
  const totalCourses = coursesResult.count || 0
  const totalEnrollments = enrollmentsResult.count || 0
  const totalCertificates = certificatesResult.count || 0

  // Buscar usuários com login mais recente
  const { data: recentUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, role, last_login_at, created_at')
    .order('last_login_at', { ascending: false, nullsFirst: false })
    .limit(5)
  
  if (usersError) {
    console.error('Erro ao buscar usuários recentes:', usersError)
  }

  // Buscar cursos pendentes de aprovação
  const { data: pendingCourses } = await supabase
    .from('courses')
    .select(`
      id, 
      title, 
      teacher_id, 
      created_at,
      teacher:profiles!teacher_id(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Total de Usuários',
      value: totalUsers || 0,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Cursos',
      value: totalCourses || 0,
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: 'Matrículas Ativas',
      value: totalEnrollments || 0,
      icon: Activity,
      color: 'text-purple-600'
    },
    {
      title: 'Certificados Emitidos',
      value: totalCertificates || 0,
      icon: Award,
      color: 'text-orange-600'
    }
  ]

  return (
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600">
          Gerencie usuários, cursos e monitore o desempenho da plataforma
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ações Rápidas - MOVIDO PARA CIMA */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Link href="/administrador/usuarios" className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors block">
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-blue-900">Gerenciar Usuários</p>
            <p className="text-sm text-blue-600">Ver todos os usuários</p>
          </Link>
          <Link href="/administrador/cursos" className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors block">
            <BookOpen className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-green-900">Gerenciar Cursos</p>
            <p className="text-sm text-green-600">Aprovar e gerenciar cursos</p>
          </Link>
          <Link href="/administrador/armazenamento" className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors block">
            <HardDrive className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-medium text-orange-900">Limpeza de Storage</p>
            <p className="text-sm text-orange-600">Gerenciar arquivos órfãos</p>
          </Link>
          <Link href="/administrador/auditoria" className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors block">
            <Shield className="w-6 h-6 text-red-600 mb-2" />
            <p className="font-medium text-red-900">Logs de Auditoria</p>
            <p className="text-sm text-red-600">Monitorar ações sensíveis</p>
          </Link>
          <Link href="/administrador/relatorios" className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors block">
            <Activity className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-purple-900">Relatórios</p>
            <p className="text-sm text-purple-600">Ver relatórios detalhados</p>
          </Link>
          <Link href="/administrador/polos" className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors block">
            <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
            <p className="font-medium text-indigo-900">Polos Educacionais</p>
            <p className="text-sm text-indigo-600">Gerenciar instituições parceiras</p>
          </Link>
          <Link href="/administrador/matriculas" className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors block">
            <GraduationCap className="w-6 h-6 text-cyan-600 mb-2" />
            <p className="font-medium text-cyan-900">Matrículas</p>
            <p className="text-sm text-cyan-600">Gerenciar matrículas dos alunos</p>
          </Link>
          <Link href="/administrador/avaliacoes" className="p-4 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors block">
            <Award className="w-6 h-6 text-pink-600 mb-2" />
            <p className="font-medium text-pink-900">Avaliações</p>
            <p className="text-sm text-pink-600">Gerenciar avaliações da plataforma</p>
          </Link>
          <Link href="/administrador/certificados" className="p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors block">
            <FileText className="w-6 h-6 text-amber-600 mb-2" />
            <p className="font-medium text-amber-900">Certificados</p>
            <p className="text-sm text-amber-600">Gerenciar todos os certificados</p>
          </Link>
          <Link href="/administrador/pagamentos" className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors block">
            <CreditCard className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="font-medium text-emerald-900">Pagamentos</p>
            <p className="text-sm text-emerald-600">Monitorar transações e vendas</p>
          </Link>
          <Link href="/administrador/catalogo-cursos" className="p-4 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors block">
            <Tags className="w-6 h-6 text-teal-600 mb-2" />
            <p className="font-medium text-teal-900">Catálogo de Cursos</p>
            <p className="text-sm text-teal-600">Gerenciar cursos categorizados</p>
          </Link>
        </div>
      </Card>

      {/* Controle da API SIE */}
      <SieApiControl />

      {/* ESPAÇAMENTO ADICIONAL ENTRE SIE E SEÇÕES ABAIXO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Logins Recentes */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Logins Recentes
          </h2>
          <div className="space-y-4">
            {recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {user.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user.role === 'student' ? 'Estudante' : 
                     user.role === 'teacher' ? 'Professor' : 'Administrador'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {user.last_login_at 
                      ? formatInTimeZone(
                          new Date(user.last_login_at),
                          'America/Sao_Paulo',
                          "dd/MM/yyyy 'às' HH:mm"
                        )
                      : formatInTimeZone(
                          new Date(user.created_at),
                          'America/Sao_Paulo',
                          'dd/MM/yyyy'
                        )
                    }
                  </p>
                  {user.last_login_at && (
                    <p className="text-xs text-gray-400">Último login</p>
                  )}
                </div>
              </div>
            ))}
            {(!recentUsers || recentUsers.length === 0) && (
              <p className="text-gray-500 text-center py-4">
                Nenhum usuário encontrado
              </p>
            )}
          </div>
        </Card>

        {/* Cursos Pendentes */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Cursos Pendentes de Aprovação
          </h2>
          <div className="space-y-4">
            {pendingCourses?.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {course.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Por: {course.teacher?.full_name || 'Professor não encontrado'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(course.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {(!pendingCourses || pendingCourses.length === 0) && (
              <p className="text-gray-500 text-center py-4">
                Nenhum curso pendente
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}