'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { formatCPF } from '@/lib/utils'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    cpf: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Formatar CPF automaticamente
    if (name === 'cpf') {
      const cleanValue = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [name]: cleanValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validações básicas
    if (formData.cpf.length !== 11) {
      setError('CPF deve ter 11 dígitos')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      // Criar usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Atualizar perfil com CPF
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            cpf: formData.cpf,
            full_name: formData.full_name
          })
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError)
        }
      }

      // Redirecionar para dashboard do estudante
      router.push('/aluno')
      
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name" required>Nome Completo</Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div>
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="seu@email.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="cpf" required>CPF</Label>
        <Input
          id="cpf"
          name="cpf"
          value={formData.cpf}
          onChange={handleChange}
          placeholder="Apenas números"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Formato: {formatCPF(formData.cpf) || '000.000.000-00'}
        </p>
      </div>

      <div>
        <Label htmlFor="password" required>Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 6 caracteres"
          minLength={6}
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </Button>

      <div className="text-center text-sm text-gray-600">
        <p>
          Ao criar uma conta, você concorda com nossos{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">
            Termos de Uso
          </a>
        </p>
      </div>
    </form>
  )
}
