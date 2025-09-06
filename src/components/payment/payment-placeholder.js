'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { 
  CreditCard, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle,
  Info,
  Lock
} from 'lucide-react'

export function PaymentPlaceholder({ course, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('credit')
  const [processing, setProcessing] = useState(false)

  const handlePayment = async () => {
    setProcessing(true)
    
    // Simular processamento
    setTimeout(() => {
      setProcessing(false)
      if (onSuccess) {
        onSuccess({
          method: selectedMethod,
          amount: course.price,
          courseId: course.id
        })
      }
    }, 3000)
  }

  const paymentMethods = [
    {
      id: 'credit',
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: DollarSign,
      description: 'Pagamento instantâneo'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Aviso de Sistema Placeholder */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 text-yellow-600" />
          <div>
            <h4 className="font-semibold text-yellow-900">
              Sistema de Pagamento em Desenvolvimento
            </h4>
            <p className="text-sm text-yellow-700">
              Esta é uma versão demonstrativa. Nenhum pagamento real será processado.
            </p>
          </div>
        </div>
      </Card>

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
              Duração: {Math.floor(course.duration / 60)}h {course.duration % 60}min
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-green-600">
              {course.price ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}
            </span>
          </div>
        </div>
      </Card>

      {/* Métodos de Pagamento */}
      {course.price && course.price > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Método de Pagamento
          </h3>
          
          <div className="space-y-3 mb-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <label
                  key={method.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="sr-only"
                  />
                  <Icon className={`w-6 h-6 mr-3 ${
                    selectedMethod === method.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                  )}
                </label>
              )
            })}
          </div>

          {/* Formulário de Pagamento */}
          <div className="space-y-4 mb-6">
            {selectedMethod === 'credit' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome no Cartão
                  </label>
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'pix' && (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <div className="w-32 h-32 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-600">QR Code PIX</span>
                </div>
                <p className="text-sm text-gray-600">
                  Código PIX será gerado após confirmação
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Segurança */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <Lock className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Pagamento Seguro</p>
            <p className="text-sm text-green-700">
              Seus dados estão protegidos com criptografia SSL de 256 bits
            </p>
          </div>
        </div>
      </Card>

      {/* Botão de Pagamento */}
      <Button
        onClick={handlePayment}
        disabled={processing}
        className="w-full flex items-center justify-center gap-2 py-3"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processando Pagamento...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            {course.price && course.price > 0 
              ? `Pagar R$ ${course.price.toFixed(2)}`
              : 'Matricular Gratuitamente'
            }
          </>
        )}
      </Button>
    </div>
  )
}