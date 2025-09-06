'use client'
import { useState } from 'react'
import { Users, UserPlus, Search, Filter, Crown, BookOpen, Trash2 } from 'lucide-react'
import CreateTeacherModal from './create-teacher-modal'
import UserRoleManager from './user-role-manager'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { useDeleteOperations } from '@/hooks/use-delete-operations'

export default function UsersList({ initialUsers = [], stats = [] }) {
  // Garantir que sempre recebemos arrays válidos
  const safeUsers = Array.isArray(initialUsers) ? initialUsers : []
  const safeStats = Array.isArray(stats) ? stats : []

  const [users, setUsers] = useState(safeUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const { deleteUser, bulkDeleteUsers, loading, error } = useDeleteOperations()

  const filteredUsers = users.filter(user => {
    if (!user || typeof user !== 'object') return false
    
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
  }

  const handleTeacherCreated = () => {
    // Recarregar a página para buscar novos dados
    window.location.reload()
  }

  const handleDeleteUser = async (user) => {
    if (window.confirm(
      `Tem certeza que deseja deletar o usuário "${user.full_name || user.email}"?\n\n` +
      `Esta ação é irreversível e irá deletar:\n` +
      `• Perfil do usuário\n` +
      `• Todas as matrículas\n` +
      `• Todos os certificados\n` +
      `${user.role === 'teacher' ? '• Todos os cursos criados\n' : ''}` +
      `• Avatar e arquivos relacionados`
    )) {
      const result = await deleteUser(user.id, user)
      if (result.success) {
        setUsers(users.filter(u => u.id !== user.id))
        alert('Usuário deletado com sucesso!')
      } else {
        alert('Erro ao deletar usuário: ' + result.error)
      }
    }
  }

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
      setShowBulkActions(false)
    } else {
      const allIds = filteredUsers.map(user => user.id)
      setSelectedUsers(allIds)
      setShowBulkActions(true)
    }
  }

  const handleBulkDelete = async () => {
    const selectedUsersData = users.filter(user => selectedUsers.includes(user.id))
    const adminCount = selectedUsersData.filter(user => user.role === 'admin').length
    const teacherCount = selectedUsersData.filter(user => user.role === 'teacher').length
    const studentCount = selectedUsersData.filter(user => user.role === 'student').length

    if (window.confirm(
      `Tem certeza que deseja deletar ${selectedUsers.length} usuário(s)?\n\n` +
      `Serão deletados:\n` +
      `• ${adminCount} administrador(es)\n` +
      `• ${teacherCount} professor(es)\n` +
      `• ${studentCount} estudante(s)\n\n` +
      `Esta ação é irreversível e irá deletar todos os dados relacionados.`
    )) {
      const result = await bulkDeleteUsers(selectedUsers)
      if (result.success) {
        setUsers(users.filter(u => !selectedUsers.includes(u.id)))
        setSelectedUsers([])
        setShowBulkActions(false)
        alert(`${selectedUsers.length} usuário(s) deletado(s) com sucesso!`)
      } else {
        alert('Erro na operação em lote: ' + result.error)
      }
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />
      case 'teacher': return <BookOpen className="w-4 h-4 text-green-600" />
      case 'student': return <Users className="w-4 h-4 text-blue-600" />
      default: return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <>
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
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] flex-shrink-0"
            >
              <option value="all">Todos os papéis</option>
              <option value="student">Estudantes</option>
              <option value="teacher">Professores</option>
              <option value="admin">Administradores</option>
            </select>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 min-h-[44px] flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Professor</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Ações em lote */}
        {showBulkActions && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg gap-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-800 font-medium">
                {selectedUsers.length} usuário(s) selecionado(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setSelectedUsers([])
                  setShowBulkActions(false)
                }}
                variant="outline"
                size="sm"
                className="min-h-[44px] flex-shrink-0"
              >
                <span className="whitespace-nowrap">Cancelar Seleção</span>
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={loading}
                size="sm"
                className="bg-red-600 hover:bg-red-700 min-h-[44px] flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Deletar Selecionados</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de usuários - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
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
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Sem nome'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserRoleManager user={user} onUpdate={handleUserUpdate} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.cpf || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button
                      onClick={() => handleDeleteUser(user)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum usuário encontrado
          </div>
        )}
      </div>

      {/* Lista de usuários - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => handleSelectUser(user.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 min-w-[20px]"
              />
              
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={user.avatar_url}
                    alt=""
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || 'Sem nome'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  
                  {/* Ações */}
                  <Button
                    onClick={() => handleDeleteUser(user)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 flex-shrink-0"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Informações */}
                <div className="space-y-1 text-sm text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>Papel:</span>
                    <UserRoleManager user={user} onUpdate={handleUserUpdate} />
                  </div>
                  {user.cpf && (
                    <div className="flex items-center justify-between">
                      <span>CPF:</span>
                      <span className="truncate ml-2">{user.cpf}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span>Telefone:</span>
                      <span className="truncate ml-2">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Cadastro:</span>
                    <span className="ml-2">{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
            Nenhum usuário encontrado
          </div>
        )}
      </div>

      {/* Modal de criar professor */}
      <CreateTeacherModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTeacherCreated}
      />
    </>
  )
}