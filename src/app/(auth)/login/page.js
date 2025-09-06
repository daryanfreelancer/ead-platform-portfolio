import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import LoginForm from '@/components/forms/login-form'

export const metadata = {
  title: 'Login - EduPlatform',
  description: 'Faça login na plataforma EduPlatform'
}

export default function LoginPage() {
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
                Entrar
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Acesse sua conta na plataforma EduPlatform
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <LoginForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  href="/register" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Cadastre-se aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Links úteis */}
        <div className="text-center space-y-2">
          <Link 
            href="/" 
            className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Voltar para o início
          </Link>
          <Link 
            href="/consulta-certificados" 
            className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Consultar certificados sem login
          </Link>
        </div>
      </div>
    </div>
  )
}
