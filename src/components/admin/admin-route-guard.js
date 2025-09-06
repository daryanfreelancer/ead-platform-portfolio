'use client'
import { useEffect } from 'react'
import { useAuth, useRole } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

export default function AdminRouteGuard({ children }) {
  const { user, profile, loading, initialized } = useAuth()
  const { isAdmin } = useRole()
  const router = useRouter()

  useEffect(() => {
    // Aguardar inicialização e carregamento do perfil
    if (!initialized || loading) {
      console.log('AdminRouteGuard - Aguardando carregamento...')
      return
    }

    // Se não está logado
    if (!user) {
      console.log('AdminRouteGuard - No user, redirecting to login')
      router.push('/entrar?redirect=/administrador')
      return
    }

    // Verificar admin apenas após perfil carregar
    if (profile) {
      if (!isAdmin()) {
        console.log('AdminRouteGuard - Not admin, redirecting to student dashboard')
        router.push('/aluno')
      } else {
        console.log('AdminRouteGuard - Admin verified, allowing access')
      }
    }
  }, [user, profile, loading, initialized, isAdmin, router])

  // Mostrar loading enquanto verifica
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se não está logado ou não é admin, não renderizar nada
  if (!user || !isAdmin()) {
    return null
  }

  // Se passou em todas as verificações, renderizar children
  return children
}