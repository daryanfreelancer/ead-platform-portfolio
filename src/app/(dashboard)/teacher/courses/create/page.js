import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CourseFormEnhanced } from '@/components/forms/course-form-enhanced'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function CreateCoursePage() {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Criar Novo Curso
        </h1>
        <p className="text-gray-600">
          Preencha as informações abaixo para criar um novo curso na plataforma
        </p>
      </div>

      <CourseFormEnhanced 
        user={user}
        mode="create"
      />
    </div>
  )
}