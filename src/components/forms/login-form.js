'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Starting login process
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }
      
      if (!data?.user) {
        throw new Error('Login falhou - usuário não retornado')
      }

      // Verificar o role do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Profile fetched successfully

      // Aguardar um momento para garantir que a sessão seja propagada
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se a sessão está realmente ativa antes do redirect
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        
        if (!retrySession) {
          setError('Erro na autenticação. Tente novamente.')
          return
        }
      }
      
      // Usar window.location.href para forçar recarregamento completo
      // Profile role detected, preparing redirect
      
      if (profile?.role === 'admin') {
        // Redirecting admin to dashboard
        setTimeout(() => {
          window.location.href = '/administrador'
        }, 100) // Pequeno delay para garantir que o log apareça
      } else if (profile?.role === 'teacher') {
        // Redirecting teacher to dashboard
        setTimeout(() => {
          window.location.href = '/professor'
        }, 100)
      } else {
        // Redirecting student to dashboard
        setTimeout(() => {
          window.location.href = '/aluno'
        }, 100)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link 
            href="/esqueci-senha" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}