import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TestAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar todos os profiles para debug
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('*')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Admin Profile</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">User Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              id: user.id,
              email: user.email,
              created_at: user.created_at
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Profile Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              profile: profile,
              profileError: profileError?.message,
              hasProfile: !!profile,
              role: profile?.role
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">All Profiles</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              profiles: allProfiles,
              error: allProfilesError?.message,
              count: allProfiles?.length
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}