import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense, lazy } from 'react'

// Lazy load do componente pesado
const AdminEnrollmentsContent = lazy(() => import('@/components/admin/admin-enrollments-content'))

// Força renderização dinâmica
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/entrar')
  }

  // Verificar se é admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/administrador')
  }

  // Buscar todas as matrículas com informações relacionadas
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:profiles!student_id(id, full_name, email, cpf),
      course:courses(id, title, teacher_id, thumbnail_url, is_free, price)
    `)
    .order('enrolled_at', { ascending: false })

  // Garantir que enrollments seja sempre um array
  const safeEnrollments = Array.isArray(enrollments) ? enrollments : []

  // Buscar estatísticas
  const { data: stats } = await supabase
    .from('enrollments')
    .select('id, progress, completed_at')
  
  const totalEnrollments = stats?.length || 0
  const activeEnrollments = stats?.filter(e => !e.completed_at).length || 0
  const completedEnrollments = stats?.filter(e => e.completed_at).length || 0
  const averageProgress = stats?.length > 0 
    ? Math.round(stats.reduce((acc, e) => acc + (e.progress || 0), 0) / stats.length)
    : 0

  const enrollmentStats = [
    {
      title: 'Total de Matrículas',
      value: totalEnrollments,
      color: 'text-blue-600'
    },
    {
      title: 'Matrículas Ativas',
      value: activeEnrollments,
      color: 'text-green-600'
    },
    {
      title: 'Cursos Concluídos',
      value: completedEnrollments,
      color: 'text-purple-600'
    },
    {
      title: 'Progresso Médio',
      value: `${averageProgress}%`,
      color: 'text-orange-600'
    }
  ]

  return (
    <Suspense fallback={
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <AdminEnrollmentsContent initialEnrollments={safeEnrollments} stats={enrollmentStats} />
    </Suspense>
  )
}