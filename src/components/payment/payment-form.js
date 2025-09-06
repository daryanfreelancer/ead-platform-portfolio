'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { 
  CreditCard, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle,
  AlertCircle,
  Lock,
  ExternalLink
} from 'lucide-react'

export function PaymentForm({ course, user }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // Criar preferência de pagamento
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      // Redirecionar para o Mercado Pago
      window.location.href = data.init_point

    } catch (err) {
      console.error('Erro ao processar pagamento:', err)
      setError(err.message || 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleFreeEnrollment = async () => {
    setLoading(true)
    setError('')

    try {
      // Matrícula direta para cursos gratuitos
      const response = await fetch('/api/enrollments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar matrícula')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/courses/${course.id}/learn`)
      }, 1500)

    } catch (err) {
      console.error('Erro ao realizar matrícula:', err)
      setError(err.message || 'Erro ao realizar matrícula')
    } finally {
      setLoading(false)
    }
  }

  const isFree = course.is_free || !course.price || course.price <= 0

  return (
    <div className="space-y-6">
      {/* Resumo do Curso */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo da Compra
        </h3>
        
        <div className="flex items-center space-x-4 mb-4">
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{course.title}</h4>
            <p className="text-sm text-gray-600">
              {course.description && course.description.substring(0, 100)}...
            </p>
            {course.duration && (
              <p className="text-sm text-gray-500 mt-1">
                Duração: {Math.floor(course.duration / 60)}h {course.duration % 60}min
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className={`text-2xl font-bold ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
              {isFree ? 'Gratuito' : `R$ ${course.price.toFixed(2)}`}
            </span>
          </div>
        </div>
      </Card>

      {/* Métodos de Pagamento para Cursos Pagos */}
      {!isFree && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métodos de Pagamento
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Cartão de Crédito</p>
                <p className="text-sm text-gray-600">Visa, Mastercard, Elo - Parcelamento em até 12x</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-green-200 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">PIX</p>
                <p className="text-sm text-gray-600">Pagamento instantâneo - Aprovação imediata</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-2">O que você receberá:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Acesso vitalício ao curso</li>
              <li>• Certificado de conclusão</li>
              <li>• Suporte técnico</li>
              <li>• Atualizações gratuitas</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Segurança */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <Lock className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">
              {isFree ? 'Matrícula Segura' : 'Pagamento Seguro'}
            </p>
            <p className="text-sm text-green-700">
              {isFree 
                ? 'Seus dados estão protegidos com criptografia SSL' 
                : 'Processamento seguro via Mercado Pago com criptografia SSL'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Mensagens de Erro/Sucesso */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700">
              Matrícula realizada com sucesso! Redirecionando...
            </p>
          </div>
        </Card>
      )}

      {/* Botão de Ação */}
      <Button
        onClick={isFree ? handleFreeEnrollment : handlePayment}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            {isFree ? 'Matriculando...' : 'Redirecionando para pagamento...'}
          </>
        ) : (
          <>
            {isFree ? (
              <>
                <ShoppingCart className="w-5 h-5" />
                Matricular-se Gratuitamente
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Pagar R$ {course.price.toFixed(2)}
              </>
            )}
          </>
        )}
      </Button>

      {!isFree && (
        <p className="text-xs text-gray-500 text-center">
          Você será redirecionado para o site seguro do Mercado Pago para finalizar o pagamento
        </p>
      )}
    </div>
  )
}