'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, Check } from 'lucide-react'

const supabase = createClient()

export function ProfileForm({ user, profile }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    cpf: profile?.cpf || '',
    avatar_url: profile?.avatar_url || null
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarUpdate = (newAvatarUrl) => {
    setFormData(prev => ({
      ...prev,
      avatar_url: newAvatarUrl
    }))
    setMessage({
      type: 'success',
      text: 'Avatar atualizado com sucesso!'
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          cpf: formData.cpf
        })
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro ao atualizar perfil: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleError = (errorMessage) => {
    setMessage({
      type: 'error',
      text: errorMessage
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  return (
    <div className="space-y-8">
      {/* Mensagem de feedback */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seção do Avatar */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Foto de Perfil
          </h2>
          <div className="flex flex-col items-center space-y-4">
            <AvatarUpload
              currentAvatarUrl={formData.avatar_url}
              userId={user.id}
              onAvatarUpdate={handleAvatarUpdate}
              onError={handleError}
              size="xl"
            />
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                Clique na imagem para alterar
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG ou WebP. Máximo 5MB
              </p>
            </div>
          </div>
        </Card>

        {/* Seção de Informações Pessoais */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Informações Pessoais
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Input
                  id="role"
                  type="text"
                  value={
                    profile?.role === 'student' ? 'Estudante' :
                    profile?.role === 'teacher' ? 'Professor' : 
                    profile?.role === 'admin' ? 'Administrador' : 'Não definido'
                  }
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O tipo de usuário é definido pelo administrador
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </div>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Seção de Informações da Conta */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Informações da Conta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-medium text-gray-700">Data de Criação</p>
            <p className="text-gray-600">
              {new Date(user.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Último Login</p>
            <p className="text-gray-600">
              {user.last_sign_in_at ? 
                new Date(user.last_sign_in_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 
                'Nunca'
              }
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Email Confirmado</p>
            <p className={`${user.email_confirmed_at ? 'text-green-600' : 'text-red-600'}`}>
              {user.email_confirmed_at ? 'Sim' : 'Não'}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">ID do Usuário</p>
            <p className="text-gray-600 font-mono text-xs">{user.id}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}