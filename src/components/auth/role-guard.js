'use client'

import { useRole } from '@/hooks/use-auth'
import { AlertCircle, Shield } from 'lucide-react'

export function RoleGuard({ 
  children, 
  roles, 
  fallback = null,
  showUnauthorized = false 
}) {
  const { hasRole, loading } = useRole()

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando permissões...</span>
      </div>
    )
  }

  // Verificar se tem permissão
  if (!hasRole(roles)) {
    if (showUnauthorized) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="p-4 bg-red-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acesso Não Autorizado
          </h3>
          <p className="text-gray-600 max-w-md">
            Você não tem permissão para acessar este conteúdo. 
            Entre em contato com o administrador se acredita que isso é um erro.
          </p>
        </div>
      )
    }

    return fallback
  }

  return children
}

export function AdminOnly({ children, fallback = null, showUnauthorized = false }) {
  return (
    <RoleGuard 
      roles="admin" 
      fallback={fallback}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </RoleGuard>
  )
}

export function TeacherOnly({ children, fallback = null, showUnauthorized = false }) {
  return (
    <RoleGuard 
      roles={['teacher', 'admin']} 
      fallback={fallback}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </RoleGuard>
  )
}

export function StudentOnly({ children, fallback = null, showUnauthorized = false }) {
  return (
    <RoleGuard 
      roles={['student', 'teacher', 'admin']} 
      fallback={fallback}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </RoleGuard>
  )
}