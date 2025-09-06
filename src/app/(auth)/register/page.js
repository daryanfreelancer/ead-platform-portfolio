import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import RegisterForm from '@/components/forms/register-form'
import MaintenanceMessage from '@/components/ui/maintenance-message'
import { isFeatureAvailable } from '@/lib/config/maintenance'

export const metadata = {
  title: 'Cadastro - EduPlatform',
  description: 'Crie sua conta na plataforma EduPlatform'
}

export default function RegisterPage() {
  // Verificar se o cadastro está disponível
  if (!isFeatureAvailable('registrationDisabled')) {
    return (
      <MaintenanceMessage
        title="Cadastro Temporariamente Indisponível"
        message="O cadastro de novos estudantes está temporariamente indisponível para manutenção e melhorias na plataforma."
        showBackButton={true}
        backUrl="/"
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Criar Conta
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Cadastre-se na plataforma EduPlatform e comece a estudar
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <RegisterForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Entre aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefícios de se cadastrar */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            ✨ Benefícios de se cadastrar:
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Acesso a todos os cursos disponíveis</li>
            <li>• Acompanhamento do seu progresso</li>
            <li>• Certificados digitais automáticos</li>
            <li>• Suporte técnico especializado</li>
          </ul>
        </div>

        {/* Links úteis */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  )
}
