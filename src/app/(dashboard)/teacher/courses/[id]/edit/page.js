import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CourseFormEnhanced } from '@/components/forms/course-form-enhanced'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function EditCoursePage({ params }) {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é professor ou admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    redirect('/aluno')
  }

  // Buscar curso específico
  let query = supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)

  // Apenas filtrar por teacher_id se não for admin
  if (profile.role !== 'admin') {
    query = query.eq('teacher_id', user.id)
  }

  const { data: course, error } = await query.single()

  if (error || !course) {
    redirect('/professor')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Editar Curso
        </h1>
        <p className="text-gray-600">
          Atualize as informações do curso &quot;{course.title}&quot;
        </p>
      </div>

      <CourseFormEnhanced 
        user={user}
        course={course}
        mode="edit"
      />
    </div>
  )
}