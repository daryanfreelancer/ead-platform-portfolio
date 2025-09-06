'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SessionRefresher() {
  const intervalRef = useRef(null)
  const lastRefreshRef = useRef(Date.now())
  const failureCountRef = useRef(0)

  useEffect(() => {
    // Função para refresh da sessão
    const refreshSession = async () => {
      try {
        const now = Date.now()
        // Evitar refresh muito frequente (mínimo 60 segundos entre refreshes)
        if (now - lastRefreshRef.current < 60000) {
          console.log(`SessionRefresher - Throttled (${now - lastRefreshRef.current}ms ago)`)
          return
        }

        // Pausar refreshes após muitas falhas seguidas
        if (failureCountRef.current >= 3) {
          console.log('SessionRefresher - Pausado devido a muitas falhas seguidas')
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session) {
          // Verificar se o token está próximo de expirar (dentro de 20 minutos)
          // Mais agressivo para evitar perda de sessão durante inatividade
          const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
          const timeUntilExpiry = expiresAt - now
          
          if (timeUntilExpiry < 1200000 && timeUntilExpiry > 0) { // 20 minutos
            console.log('SessionRefresher - Token expiring soon, refreshing...')
            const { data, error: refreshError } = await supabase.auth.refreshSession()
            
            if (refreshError) {
              console.error('SessionRefresher - Error refreshing session:', refreshError.message || 'Erro desconhecido')
              failureCountRef.current += 1
            } else {
              console.log('SessionRefresher - Session refreshed successfully')
              lastRefreshRef.current = now
              failureCountRef.current = 0 // Reset contador de falhas
            }
          }
        }
      } catch (error) {
        console.error('SessionRefresher - Error:', error.message || 'Erro desconhecido')
        failureCountRef.current += 1
      }
    }

    // Aguardar 5 segundos antes da primeira verificação para evitar conflito com login inicial
    setTimeout(refreshSession, 5000)

    // Configurar intervalo para verificar a cada 10 minutos 
    intervalRef.current = setInterval(refreshSession, 600000) // 10 minutos

    // RESTAURAR eventos de foco e visibilidade para persistência robusta
    // Essencial para manter sessão quando usuário retorna após inatividade
    const handleFocus = () => {
      console.log('SessionRefresher - Window focused, checking session...')
      refreshSession()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('SessionRefresher - Page visible, checking session...')
        refreshSession()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}