import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense, lazy } from 'react'

// Lazy load do componente pesado
const AdminUsersContent = lazy(() => import('@/components/admin/admin-users-content'))

// Força renderização dinâmica
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminUsersPage() {
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

  // Buscar todos os usuários com tratamento de erro (excluindo usuário de sistema)
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', '00000000-0000-0000-0000-000000000000') // Excluir usuário de sistema
    .neq('email', 'system@eduplatform.internal') // Dupla verificação
    .order('created_at', { ascending: false })

  // Garantir que users seja sempre um array
  const safeUsers = Array.isArray(users) ? users : []

  // Calcular estatísticas
  const totalUsers = safeUsers.length
  const totalAdmins = safeUsers.filter(u => u && u.role === 'admin').length
  const totalTeachers = safeUsers.filter(u => u && u.role === 'teacher').length
  const totalStudents = safeUsers.filter(u => u && u.role === 'student').length

  const stats = [
    {
      title: 'Total de Usuários',
      value: totalUsers,
      color: 'text-gray-600'
    },
    {
      title: 'Administradores',
      value: totalAdmins,
      color: 'text-yellow-600'
    },
    {
      title: 'Professores',
      value: totalTeachers,
      color: 'text-green-600'
    },
    {
      title: 'Estudantes',
      value: totalStudents,
      color: 'text-blue-600'
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
      <AdminUsersContent initialUsers={safeUsers} stats={stats} />
    </Suspense>
  )
}