import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VideoPlayer } from '@/components/learning/video-player'
import { LessonVideoPlayer } from '@/components/learning/lesson-video-player'
import { ProgressTracker } from '@/components/learning/progress-tracker'
import { CourseContent } from '@/components/learning/course-content'
import { CourseContentEnhanced } from '@/components/learning/course-content-enhanced'
import { StudentOnly } from '@/components/auth/role-guard'
import { LearningInterface } from '@/components/learning/learning-interface'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function LearnPage({ params }) {
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

  // Buscar curso
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!teacher_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (error || !course) {
    redirect('/cursos')
  }

  // Verificar se o usuário está matriculado
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('course_id', params.id)
    .eq('student_id', user.id)
    .single()

  if (!enrollment) {
    redirect(`/courses/${params.id}`)
  }

  return (
    <StudentOnly showUnauthorized={true}>
      <LearningInterface
        course={course}
        enrollment={enrollment}
        user={user}
      />
    </StudentOnly>
  )
}