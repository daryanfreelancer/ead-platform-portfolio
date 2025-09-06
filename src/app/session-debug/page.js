'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SessionDebugPage() {
  const [sessionInfo, setSessionInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        // Verificar sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Verificar usuário
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Verificar perfil se houver usuário
        let profile = null
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          profile = data
        }

        // Verificar cookies
        const cookies = document.cookie.split(';').map(c => c.trim())
        const authCookies = cookies.filter(c => 
          c.includes('sb-') || 
          c.includes('auth-token') || 
          c.includes('eduplatform')
        )

        setSessionInfo({
          session: session ? {
            hasSession: true,
            accessToken: session.access_token ? 'Present' : 'Missing',
            refreshToken: session.refresh_token ? 'Present' : 'Missing',
            expiresAt: session.expires_at,
            expiresIn: session.expires_in,
            user: session.user?.email
          } : { hasSession: false },
          user: user ? {
            id: user.id,
            email: user.email,
            confirmed: user.email_confirmed_at
          } : null,
          profile: profile,
          cookies: authCookies.length > 0 ? authCookies : ['No auth cookies found'],
          errors: {
            sessionError: sessionError?.message,
            userError: userError?.message
          },
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setSessionInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkSession()
    
    // Atualizar a cada 2 segundos
    const interval = setInterval(checkSession, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Carregando informações de sessão...</h1>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        🔍 Debug de Sessão (Página Pública)
      </h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
        <p className="text-yellow-800">
          Esta página é pública e não requer autenticação. 
          Se você está vendo isso, o middleware está funcionando.
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Informações da Sessão:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-6 space-y-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recarregar Página
        </button>
        
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signOut()
            if (!error) {
              window.location.href = '/entrar'
            }
          }}
          className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Fazer Logout
        </button>
      </div>
    </div>
  )
}