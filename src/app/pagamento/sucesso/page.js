import { CheckCircle, BookOpen, Home } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Aprovado!
          </h1>
          <p className="text-gray-600">
            Sua compra foi processada com sucesso. Você já pode acessar o curso.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">
            O que acontece agora?
          </h3>
          <ul className="text-sm text-green-700 space-y-1 text-left">
            <li>• Sua matrícula foi ativada automaticamente</li>
            <li>• Acesso liberado para todas as aulas</li>
            <li>• Certificado disponível após conclusão</li>
            <li>• Recibo enviado para seu e-mail</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/aluno">
            <Button className="w-full flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5" />
              Ir para Meus Cursos
            </Button>
          </Link>
          
          <Link href="/aluno">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Caso tenha alguma dúvida, entre em contato com nosso suporte.
        </p>
      </Card>
    </div>
  )
}