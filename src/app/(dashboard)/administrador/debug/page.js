import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'

export default async function AdminDebugPage() {
  const supabase = await createClient()
  
  // Buscar informações de debug
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  let profile = null
  let profileError = null
  
  if (user) {
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = result.data
    profileError = result.error
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug de Autenticação</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Status da Sessão</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify({
            hasUser: !!user,
            hasSession: !!session,
            userError: userError?.message,
            sessionError: sessionError?.message
          }, null, 2)}
        </pre>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Dados do Usuário</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify({
            userId: user?.id,
            email: user?.email,
            emailConfirmed: user?.email_confirmed_at,
            createdAt: user?.created_at
          }, null, 2)}
        </pre>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Perfil</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify({
            profile: profile,
            profileError: profileError?.message
          }, null, 2)}
        </pre>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Token da Sessão</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify({
            accessToken: session?.access_token ? 'Presente' : 'Ausente',
            refreshToken: session?.refresh_token ? 'Presente' : 'Ausente',
            expiresAt: session?.expires_at,
            expiresIn: session?.expires_in
          }, null, 2)}
        </pre>
      </Card>
    </div>
  )
}