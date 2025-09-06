import { Clock, Eye, Home } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'

export default function PaymentPending() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Pendente
          </h1>
          <p className="text-gray-600">
            Seu pagamento está sendo processado e aguarda confirmação.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">
            O que está acontecendo?
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1 text-left">
            <li>• Pagamento em análise pela operadora</li>
            <li>• Processamento pode levar até 2 dias úteis</li>
            <li>• Você receberá um e-mail de confirmação</li>
            <li>• Acesso ao curso liberado após aprovação</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/aluno/compras">
            <Button className="w-full flex items-center justify-center gap-2">
              <Eye className="w-5 h-5" />
              Acompanhar Status
            </Button>
          </Link>
          
          <Link href="/aluno">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">
            Acompanhe seu pagamento
          </h4>
          <p className="text-sm text-blue-700">
            Acesse &quot;Meus Cursos&quot; → &quot;Compras&quot; para ver o status atualizado do seu pagamento.
          </p>
        </div>
      </Card>
    </div>
  )
}