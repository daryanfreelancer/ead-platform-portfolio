'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, User, Mail, Phone, FileText, Crown, BookOpen, Users, Key } from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { formatCPF, validateCPF } from '@/lib/utils'
import { translateError } from '@/lib/error-messages'

export default function EditUserModal({ isOpen, onClose, onSuccess, user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
    role: user?.role || 'student'
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value

    // Formatação específica para CPF
    if (name === 'cpf') {
      processedValue = formatCPF(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    // Limpar erro do campo quando usuário digita
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    if (!['student', 'teacher', 'admin'].includes(formData.role)) {
      newErrors.role = 'Papel inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    const confirmMessage = `Tem certeza que deseja enviar um link de redefinição de senha para ${user.full_name || user.email}?\n\nUm email será enviado para: ${user.email}`
    
    if (!confirm(confirmMessage)) return

    setResetPasswordLoading(true)

    try {
      const response = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      if (response.ok) {
        alert(`Link de redefinição de senha enviado com sucesso para ${user.email}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao enviar link de redefinição de senha')
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      alert('Erro interno ao enviar link de redefinição')
    } finally {
      setResetPasswordLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Sucesso - fechar modal e atualizar lista
        onSuccess?.()
        onClose()
        
        // Recarregar página para mostrar alterações
        router.refresh()
      } else {
        const data = await response.json()
        if (data.error) {
          // Traduzir erro para português
          const translatedError = translateError(data.error)
          
          // Tratar erros específicos
          if (data.error.includes('duplicate') || data.error.includes('already')) {
            setErrors({ email: translatedError })
          } else {
            setErrors({ general: translatedError })
          }
        } else {
          setErrors({ general: 'Erro ao atualizar usuário. Tente novamente.' })
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      setErrors({ general: 'Erro interno. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />
      case 'teacher': return <BookOpen className="w-4 h-4" />
      case 'student': return <Users className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
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

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Usuário
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome Completo */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="pl-10"
                placeholder="Nome completo do usuário"
                required
              />
            </div>
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                placeholder="email@exemplo.com"
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="cpf"
                name="cpf"
                type="text"
                value={formData.cpf}
                onChange={handleChange}
                className="pl-10"
                placeholder="000.000.000-00"
                maxLength="14"
              />
            </div>
            {errors.cpf && (
              <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="pl-10"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Papel/Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Papel no Sistema *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {getRoleIcon(formData.role)}
              </div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="student">Estudante</option>
                <option value="teacher">Professor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Aviso sobre mudança de papel */}
          {formData.role !== user.role && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Atenção:</strong> Alterar o papel do usuário irá modificar suas permissões no sistema.
              </p>
            </div>
          )}

          {/* Seção de Redefinição de Senha */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Redefinição de Senha</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 mb-3">
                Envie um link de redefinição de senha para o email do usuário.
              </p>
              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={resetPasswordLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                {resetPasswordLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>
            </div>
          </div>

          {/* Erro geral */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}