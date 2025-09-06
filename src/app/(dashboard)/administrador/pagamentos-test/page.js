import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TestPaymentsPage() {
  const supabase = await createClient()
  
  // Verificar autenticação
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

  // Teste simples - sem queries complexas
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste Pagamentos - Página Simplificada</h1>
      
      <div className="bg-green-100 p-4 rounded">
        <p>✅ Autenticação OK</p>
        <p>✅ Role Admin OK</p>
        <p>✅ Página renderizada sem erro</p>
      </div>
      
      <div className="mt-4">
        <p>User ID: {user.id}</p>
        <p>Role: {profile.role}</p>
      </div>
    </div>
  )
}