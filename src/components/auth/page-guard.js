'use client'

import { useRouteProtection } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export function PageGuard({ children, requiredRoles, redirectTo = '/login' }) {
  const { isAuthorized, loading } = useRouteProtection(requiredRoles, redirectTo)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando acesso...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto verificamos suas permissões
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return children
}

// Componentes específicos para cada tipo de página
export function AdminPageGuard({ children }) {
  return (
    <PageGuard requiredRoles="admin">
      {children}
    </PageGuard>
  )
}

export function TeacherPageGuard({ children }) {
  return (
    <PageGuard requiredRoles={['teacher', 'admin']}>
      {children}
    </PageGuard>
  )
}

export function StudentPageGuard({ children }) {
  return (
    <PageGuard requiredRoles={['student', 'teacher', 'admin']}>
      {children}
    </PageGuard>
  )
}

export function AuthenticatedPageGuard({ children }) {
  return (
    <PageGuard requiredRoles={['student', 'teacher', 'admin']}>
      {children}
    </PageGuard>
  )
}