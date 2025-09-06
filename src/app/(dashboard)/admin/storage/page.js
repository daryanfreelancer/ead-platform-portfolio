import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOnly } from '@/components/auth/role-guard'
import StorageCleanupComponent from '@/components/admin/storage-cleanup'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function AdminStoragePage() {
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AdminOnly showUnauthorized={true}>
        <StorageCleanupComponent />
      </AdminOnly>
    </div>
  )
}