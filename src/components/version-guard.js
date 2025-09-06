'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Versão da aplicação - incrementar quando houver mudanças que precisam re-auth
const APP_VERSION = '1.0.3'
const VERSION_KEY = 'eduplatform_app_version'

export default function VersionGuard({ children }) {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const storedVersion = localStorage.getItem(VERSION_KEY)
        
        // Se a versão mudou ou não existe
        if (storedVersion !== APP_VERSION) {
          console.log('Nova versão detectada, limpando estado...')
          
          // Limpar auth do Supabase
          const supabase = createClient()
          await supabase.auth.signOut()
          
          // Limpar todo storage local
          localStorage.clear()
          sessionStorage.clear()
          
          // Salvar nova versão
          localStorage.setItem(VERSION_KEY, APP_VERSION)
          
          // Se estava em página protegida, redirecionar para login
          const protectedPaths = ['/admin', '/teacher', '/student', '/profile', '/certificates']
          if (protectedPaths.some(path => window.location.pathname.startsWith(path))) {
            window.location.href = '/login'
          }
        }
      } catch (error) {
        console.error('Erro ao verificar versão:', error)
      }
    }
    
    // Verificar apenas uma vez ao carregar
    checkVersion()
  }, [])
  
  return children
}