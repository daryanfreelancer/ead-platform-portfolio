import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HubsManagement from '@/app/(dashboard)/administrador/polos/components/hubs-management'
import HubDiagnosticTool from '@/components/admin/hub-diagnostic-tool'

export const metadata = {
  title: 'Gerenciar Polos Educacionais - Admin',
  description: 'Gerencie os polos educacionais parceiros'
}

export default async function AdminHubsPage() {
  const supabase = await createClient()
  
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

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Buscar polos educacionais
  const { data: hubs, error } = await supabase
    .from('educational_hubs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar polos:', error)
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Polos Educacionais</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as instituições parceiras que oferecem cursos na plataforma
        </p>
      </div>

      {/* Diagnostic Tool - Show if no hubs or all inactive */}
      {(!hubs || hubs.length === 0 || hubs.every(h => !h.is_active)) && (
        <div className="mb-8">
          <HubDiagnosticTool />
        </div>
      )}

      <HubsManagement initialHubs={hubs || []} />
    </div>
  )
}