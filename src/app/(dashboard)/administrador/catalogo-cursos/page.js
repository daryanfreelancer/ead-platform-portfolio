import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCatalogManager from '@/components/admin/course-catalog-manager'

export default async function CourseCatalogPage() {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Buscar cursos do catálogo
  const { data: courses } = await supabase
    .from('course_catalog')
    .select('*')
    .order('created_at', { ascending: false })

  // Buscar configurações do WhatsApp
  const { data: whatsappSettings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['whatsapp_number', 'whatsapp_message_template'])

  const whatsappConfig = {}
  whatsappSettings?.forEach(setting => {
    whatsappConfig[setting.key] = JSON.parse(setting.value)
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo de Cursos</h1>
        <p className="text-gray-600 mt-2">
          Gerencie o catálogo de cursos exibido na página inicial
        </p>
      </div>

      <CourseCatalogManager 
        initialCourses={courses || []}
        initialWhatsappConfig={whatsappConfig}
      />
    </div>
  )
}