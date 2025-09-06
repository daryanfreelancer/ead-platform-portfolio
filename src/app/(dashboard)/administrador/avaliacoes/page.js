import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOnly } from '@/components/auth/role-guard'
import AdminEvaluationManagementPage from '@/components/admin/admin-evaluation-management-page'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function AdminEvaluationsPage() {
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

  // Buscar todas as avaliações
  const { data: evaluations, error: evaluationsError } = await supabase
    .from('evaluations')
    .select(`
      *,
      course:courses (
        id,
        title,
        status,
        is_active,
        teacher:profiles!teacher_id (
          id,
          full_name
        )
      ),
      lesson:lessons (
        id,
        title
      ),
      course_modules (
        id,
        title
      ),
      questions:evaluation_questions (
        id,
        question_text,
        question_type,
        points,
        order_index
      )
    `)
    .order('created_at', { ascending: false })

  if (evaluationsError) {
    console.error('Erro ao buscar avaliações:', evaluationsError)
  }

  // Buscar todos os cursos para o modal de criação
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, status')
    .order('title', { ascending: true })

  if (coursesError) {
    console.error('Erro ao buscar cursos:', coursesError)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AdminOnly showUnauthorized={true}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Avaliações
          </h1>
          <p className="text-gray-600">
            Supervisione e gerencie todas as avaliações da plataforma
          </p>
        </div>

        <AdminEvaluationManagementPage 
          initialEvaluations={evaluations || []}
          courses={courses || []}
        />
      </AdminOnly>
    </div>
  )
}