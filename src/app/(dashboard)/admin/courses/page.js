import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOnly } from '@/components/auth/role-guard'
import CourseManagementList from '@/components/admin/course-management-list'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/administrador')
  }

  // Buscar todos os cursos com informações do professor
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!teacher_id (
        id,
        full_name,
        avatar_url
      ),
      enrollments (
        id
      )
    `)
    .order('created_at', { ascending: false })


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AdminOnly showUnauthorized={true}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Cursos
          </h1>
          <p className="text-gray-600">
            Aprove, rejeite e gerencie todos os cursos da plataforma
          </p>
        </div>

        <CourseManagementList initialCourses={courses || []} />
      </AdminOnly>
    </div>
  )
}