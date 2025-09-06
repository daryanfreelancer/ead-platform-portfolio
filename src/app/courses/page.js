import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CoursesPageContent from '@/components/courses/courses-page-content'
import { StudentOnly } from '@/components/auth/role-guard'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
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

  // Buscar cursos publicados
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!teacher_id (
        full_name
      ),
      enrollments (
        id,
        student_id
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Buscar matrículas do usuário atual
  const { data: userEnrollments } = await supabase
    .from('enrollments')
    .select('course_id, progress, completed_at')
    .eq('student_id', user.id)

  const enrolledCourseIds = userEnrollments?.map(e => e.course_id) || []
  const enrollmentMap = userEnrollments?.reduce((acc, e) => {
    acc[e.course_id] = e
    return acc
  }, {}) || {}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <StudentOnly showUnauthorized={true}>
        <CoursesPageContent 
          initialCourses={courses || []}
          userEnrollments={userEnrollments || []}
          enrolledCourseIds={enrolledCourseIds}
          enrollmentMap={enrollmentMap}
        />
      </StudentOnly>
    </div>
  )
}