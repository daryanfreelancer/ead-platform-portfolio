'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function TestRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function checkAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('Test: No user found')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      console.log('Test: User role is', profile?.role)
      
      // Tentar redirecionamento direto
      if (profile?.role === 'admin') {
        console.log('Test: Redirecting to /administrador')
        window.location.href = '/administrador'
      }
    }

    checkAndRedirect()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Redirecionamento</h1>
      <p>Verificando autenticação...</p>
      <p className="mt-4 text-sm text-gray-600">
        Verifique o console para logs de debug.
      </p>
    </div>
  )
}