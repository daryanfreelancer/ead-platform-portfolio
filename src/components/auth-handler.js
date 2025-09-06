'use client'
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const processedRef = useRef(false)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    // Evitar processamento duplicado
    if (processedRef.current) return

    // Função para processar hash fragments do Supabase
    const processAuthHash = () => {
      // Verificar se estamos na home e temos um hash de recovery
      if (window.location.hash && window.location.hash.includes('type=recovery')) {
        console.log('AuthHandler - Recovery hash detected on:', pathname)
        
        // Se não estamos em /reset-password, redirecionar preservando o hash
        if (pathname !== '/reset-password') {
          const newUrl = `/reset-password${window.location.hash}`
          console.log('AuthHandler - Redirecting to:', newUrl)
          window.location.href = newUrl
          return
        }
      }

      // Também verificar query parameters (alguns emails usam isso)
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('type') === 'recovery' && pathname !== '/reset-password') {
        console.log('AuthHandler - Recovery params in query string')
        window.location.href = `/reset-password${window.location.search}${window.location.hash}`
      }
    }

    // Processar imediatamente ao carregar
    processAuthHash()

    // Cleanup previous subscription if exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    // Escutar mudanças de autenticação com throttling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Filtrar eventos INITIAL_SESSION excessivos
      if (event === 'INITIAL_SESSION') {
        // Apenas log na primeira vez
        if (!processedRef.current) {
          console.log('AuthHandler - Initial session loaded')
          processedRef.current = true
        }
        return
      }

      console.log('AuthHandler - Auth event:', event)
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('AuthHandler - PASSWORD_RECOVERY event detected')
        if (pathname !== '/reset-password') {
          router.push('/reset-password')
        }
      }
    })

    subscriptionRef.current = subscription

    // Verificar novamente após um pequeno delay (fallback)
    const timeoutId = setTimeout(processAuthHash, 100)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      clearTimeout(timeoutId)
    }
  }, [router, pathname])

  return null
}