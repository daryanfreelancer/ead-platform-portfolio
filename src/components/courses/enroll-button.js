'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import { BookOpen, Check, AlertCircle, CreditCard, ExternalLink } from 'lucide-react'

const supabase = createClient()

export function EnrollButton({ courseId, userId, course, className = "" }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  const isFree = course?.is_free || !course?.price || course?.price <= 0

  const handleEnroll = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Verificar se já está matriculado
      const { data: existingEnrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', userId)

      // Verificar se há erro diferente de "não encontrado"
      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw new Error('Erro ao verificar matrícula existente')
      }

      // Se já existe matrícula
      if (existingEnrollments && existingEnrollments.length > 0) {
        setMessage({
          type: 'error',
          text: 'Você já está matriculado neste curso!'
        })
        setTimeout(() => {
          router.refresh()
        }, 1000)
        return
      }

      if (isFree) {
        // Matrícula gratuita
        const response = await fetch('/api/enrollments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao realizar matrícula')
        }

        setMessage({
          type: 'success',
          text: 'Matrícula realizada com sucesso!'
        })

        // Redirecionar para a página de aprendizado após 1 segundo
        setTimeout(() => {
          router.push(`/courses/${courseId}/learn`)
        }, 1000)

      } else {
        // Curso pago - redirecionar para pagamento
        const response = await fetch('/api/payments/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao processar pagamento')
        }

        // Redirecionar para o Mercado Pago
        window.location.href = data.init_point
      }

    } catch (error) {
      console.error('Erro ao realizar matrícula:', error)
      setMessage({
        type: 'error',
        text: `Erro ao realizar matrícula: ${error.message}`
      })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  return (
    <div className={className}>
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>{isFree ? 'Matriculando...' : 'Redirecionando para pagamento...'}</span>
          </>
        ) : (
          <>
            {isFree ? (
              <>
                <BookOpen className="w-5 h-5" />
                <span>Matricular-se Gratuitamente</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Comprar por R$ {course?.price?.toFixed(2)}</span>
              </>
            )}
          </>
        )}
      </Button>
    </div>
  )
}