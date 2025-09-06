'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'

export default function LogoutButton({ variant = 'outline', children = 'Sair' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      console.log('Iniciando logout...')
      
      // Usar Supabase client padrão
      const supabase = createClient()
      
      // Tentar logout com timeout
      try {
        const logoutPromise = supabase.auth.signOut()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 3000)
        )
        
        await Promise.race([logoutPromise, timeoutPromise])
        console.log('Logout Supabase concluído')
      } catch (error) {
        console.error('Erro no logout Supabase:', error)
      }
      
      // Limpar TODOS os cookies manualmente
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      // Limpar cookies específicos do Supabase com todos os domínios possíveis
      const supabaseCookies = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'supabase.auth.token',
        'sb-iqvsbmfqzgxgfeufrqzl-auth-token'
      ]
      
      const domains = ['', '.vercel.app', window.location.hostname]
      
      supabaseCookies.forEach(cookieName => {
        domains.forEach(domain => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domain ? ` domain=${domain};` : ''}`
        })
      })
      
      // Limpar storage local
      localStorage.clear()
      sessionStorage.clear()
      
      // Limpar IndexedDB
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases()
          databases.forEach(db => {
            indexedDB.deleteDatabase(db.name)
          })
        } catch (e) {
          console.log('Erro ao limpar IndexedDB:', e)
        }
      }
      
      console.log('Limpeza completa realizada, redirecionando...')
      
      // Aguardar um pouco mais
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Redirecionar diretamente para login
      window.location.href = '/login'
      
    } catch (err) {
      console.error('Erro crítico no logout:', err)
      // Forçar limpeza e redirect mesmo com erro
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleLogout}
      disabled={loading}
      className="text-sm"
    >
      {loading ? 'Saindo...' : children}
    </Button>
  )
}