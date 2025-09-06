import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/forms/profile-form'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Meu Perfil
        </h1>
        <p className="text-gray-600">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      <ProfileForm 
        user={user}
        profile={profile}
      />
    </div>
  )
}