'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        // Verificar se há hash fragments na URL (tokens do Supabase)
        const hashFragment = window.location.hash.substring(1)
        const params = new URLSearchParams(hashFragment)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        console.log('Auth params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type })

        if (accessToken && refreshToken && type === 'recovery') {
          // Definir sessão com os tokens do hash
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Erro ao definir sessão:', error)
            setError('Erro ao processar link de recuperação. Tente novamente.')
          } else {
            console.log('Sessão definida com sucesso:', data)
            setSessionReady(true)
          }
        } else {
          // Verificar se já há uma sessão válida
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setSessionReady(true)
          } else {
            setError('Link de recuperação inválido ou expirado.')
          }
        }
      } catch (err) {
        console.error('Erro no processo de autenticação:', err)
        setError('Erro ao processar link de recuperação.')
      }
    }

    handleAuthChange()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Autenticado' : 'Não autenticado')
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessionReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validações
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      // Verificar sessão antes de atualizar
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Sessão expirada. Solicite um novo link de recuperação.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Erro ao atualizar senha:', error)
        setError(error.message || 'Erro ao redefinir senha')
        return
      }

      setSuccess(true)
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro inesperado ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Processando link de recuperação...
              </h2>
              <p className="text-gray-600">
                Aguarde enquanto validamos sua solicitação.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Senha redefinida com sucesso!
              </h2>
              <p className="text-gray-600 mb-4">
                Sua senha foi atualizada. Você será redirecionado para a página de login.
              </p>
              <div className="text-sm text-gray-500">
                Redirecionando em 3 segundos...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Erro na recuperação
              </h2>
              <p className="text-red-600 mb-4">
                {error}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Voltar para Login
                </Button>
                <p className="text-sm text-gray-600">
                  Solicite um novo link de recuperação na página de login.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Redefinir Senha
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Digite sua nova senha abaixo
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" required>Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !sessionReady}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Voltar para login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}