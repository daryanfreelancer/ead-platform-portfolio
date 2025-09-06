'use client'

import { useState, memo } from 'react'
import { Crown, BookOpen, Users, Edit2, Trash2, MoreVertical, Phone, User, Calendar, Hash } from 'lucide-react'

function MobileUserCard({ user, onEdit, onDelete, deleteLoading }) {
  const [showActions, setShowActions] = useState(false)

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />
      case 'teacher': return <BookOpen className="w-4 h-4 text-green-600" />
      case 'student': return <Users className="w-4 h-4 text-blue-600" />
      default: return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'teacher': return 'Professor'
      case 'student': return 'Estudante'
      default: return 'Usuário'
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'teacher': return 'bg-green-100 text-green-800 border-green-200'
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 relative">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4 max-w-full overflow-hidden">
        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatar_url ? (
              <img
                className="h-12 w-12 rounded-full border-2 border-gray-200"
                src={user.avatar_url}
                alt=""
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                <span className="text-white font-medium text-lg">
                  {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Informações do usuário */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {user.full_name || 'Sem nome'}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Badge do papel */}
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)} max-w-full w-full sm:w-auto sm:max-w-[140px] flex-shrink-0`}>
          <div className="flex items-center gap-1.5 min-w-0 w-full">
            <span className="flex-shrink-0">{getRoleIcon(user.role)}</span>
            <span className="truncate">{getRoleLabel(user.role)}</span>
          </div>
        </div>
      </div>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">CPF</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.cpf || '-'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 min-w-0">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Telefone</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.phone || '-'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 col-span-1 sm:col-span-2 min-w-0">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Data de Cadastro</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 max-w-full overflow-hidden">
        <button
          onClick={() => onEdit(user)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors min-h-[44px] min-w-0"
        >
          <Edit2 className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Editar</span>
        </button>
        
        <button
          onClick={() => onDelete(user)}
          disabled={deleteLoading === user.id}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 min-h-[44px] min-w-0"
        >
          <span className="flex-shrink-0">
            {deleteLoading === user.id ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </span>
          <span className="whitespace-nowrap">{deleteLoading === user.id ? 'Excluindo...' : 'Excluir'}</span>
        </button>
      </div>
    </div>
  )
}

export default memo(MobileUserCard)