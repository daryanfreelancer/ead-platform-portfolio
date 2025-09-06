import { createClient } from '@/lib/supabase/server'
import CoursesPageContent from '@/components/courses/courses-page-content'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const supabase = await createClient()

  // Verificar se o usuário está logado (opcional para catálogo público)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Buscar perfil se usuário estiver logado
  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    
    profile = profileData
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

  // Buscar matrículas do usuário atual (se logado)
  let userEnrollments = []
  if (user) {
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('course_id, progress, completed_at')
      .eq('student_id', user.id)
    
    userEnrollments = enrollmentData || []
  }

  const enrolledCourseIds = userEnrollments?.map(e => e.course_id) || []
  const enrollmentMap = userEnrollments?.reduce((acc, e) => {
    acc[e.course_id] = e
    return acc
  }, {}) || {}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CoursesPageContent 
        initialCourses={courses || []}
        userEnrollments={userEnrollments || []}
        enrolledCourseIds={enrolledCourseIds}
        enrollmentMap={enrollmentMap}
        user={user}
        profile={profile}
      />
    </div>
  )
}