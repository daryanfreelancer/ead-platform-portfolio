'use client'

import { useState, memo } from 'react'
import { Users, UserPlus, Search, Crown, BookOpen, UserX, Edit2, Trash2, MoreVertical } from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import NewTeacherModal from './new-teacher-modal'
import NewStudentModal from './new-student-modal'
import EditUserModal from './edit-user-modal'
import MobileUserCard from './mobile-user-card'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

function AdminUsersContent({ initialUsers = [], stats = [] }) {
  const router = useRouter()
  const safeUsers = Array.isArray(initialUsers) ? initialUsers : []
  const safeStats = Array.isArray(stats) ? stats : []

  const [users, setUsers] = useState(safeUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showNewTeacherModal, setShowNewTeacherModal] = useState(false)
  const [showNewStudentModal, setShowNewStudentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [showDropdown, setShowDropdown] = useState(null)

  const filteredUsers = users.filter(user => {
    if (!user || typeof user !== 'object') return false
    
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

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

  const getStatIcon = (index) => {
    const icons = [Users, Crown, BookOpen, UserX]
    const IconComponent = icons[index] || Users
    return <IconComponent className="w-6 h-6" />
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = async (user) => {
    // Proteção contra exclusão do usuário de sistema
    if (user.id === '00000000-0000-0000-0000-000000000000' || 
        user.email === 'system@eduplatform.internal') {
      alert('Não é possível excluir o usuário de sistema')
      return
    }

    // Verifica se é o último admin
    const adminCount = users.filter(u => u.role === 'admin').length
    if (user.role === 'admin' && adminCount === 1) {
      alert('Não é possível excluir o último administrador do sistema')
      return
    }

    const confirmMessage = `Tem certeza que deseja excluir o usuário ${user.full_name || user.email}?\n\nIMPORTANTE: Os cursos, aulas e módulos criados por este usuário serão preservados e transferidos para o sistema.\n\nEsta ação não pode ser desfeita.`
    
    if (!confirm(confirmMessage)) return

    setDeleteLoading(user.id)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove o usuário da lista local
        setUsers(users.filter(u => u.id !== user.id))
        // Recarrega a página para atualizar estatísticas
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir usuário. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir usuário')
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Usuários
        </h1>
        <p className="text-gray-600">
          Visualize e gerencie todos os usuários da plataforma
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {safeStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                {getStatIcon(index)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="mb-6 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>
        
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="all">Todos os papéis</option>
              <option value="student">Estudantes</option>
              <option value="teacher">Professores</option>
              <option value="admin">Administradores</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowNewTeacherModal(true)}
              className="flex items-center justify-center gap-2 min-h-[44px] flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Professor</span>
              <span className="sm:hidden">+ Prof</span>
            </Button>
            
            <Button
              onClick={() => setShowNewStudentModal(true)}
              variant="secondary"
              className="flex items-center justify-center gap-2 min-h-[44px] flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Aluno</span>
              <span className="sm:hidden">+ Aluno</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de usuários - Desktop (Tabela) */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar_url}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name || 'Sem nome'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 max-w-[120px] lg:max-w-[160px]">
                      {getRoleIcon(user.role)}
                      <span className="text-sm text-gray-900 truncate">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.cpf || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Editar usuário"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deleteLoading === user.id}
                        className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Excluir usuário"
                      >
                        {deleteLoading === user.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {users.length === 0 ? 'Nenhum usuário encontrado no sistema' : 'Nenhum usuário encontrado com os filtros selecionados'}
          </div>
        )}
      </div>

      {/* Lista de usuários - Mobile (Cards) */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <MobileUserCard
            key={user.id}
            user={user}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleteLoading={deleteLoading}
          />
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
            {users.length === 0 ? 'Nenhum usuário encontrado no sistema' : 'Nenhum usuário encontrado com os filtros selecionados'}
          </div>
        )}
      </div>

      {/* Modal Novo Professor */}
      <NewTeacherModal
        isOpen={showNewTeacherModal}
        onClose={() => setShowNewTeacherModal(false)}
        onSuccess={() => {
          // Recarregar dados dos usuários
          window.location.reload()
        }}
      />

      {/* Modal Novo Aluno */}
      <NewStudentModal
        isOpen={showNewStudentModal}
        onClose={() => setShowNewStudentModal(false)}
        onSuccess={() => {
          // Recarregar dados dos usuários
          window.location.reload()
        }}
      />

      {/* Modal Editar Usuário */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        onSuccess={() => {
          // Recarregar dados dos usuários
          window.location.reload()
        }}
        user={selectedUser}
      />
    </div>
  )
}

export default memo(AdminUsersContent)