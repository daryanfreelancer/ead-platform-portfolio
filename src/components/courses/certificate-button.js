'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCertificateEligibility } from '@/hooks/use-certificate-eligibility'
import { 
  Award, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Download,
  Circle
} from 'lucide-react'

export function CertificateButton({ course, enrollment, user }) {
  const [downloading, setDownloading] = useState(false)
  const { 
    isEligible, 
    loading, 
    reason, 
    failedEvaluations, 
    pendingEvaluations 
  } = useCertificateEligibility(course, enrollment, user)

  const handleDownloadCertificate = async () => {
    if (!isEligible) return

    setDownloading(true)
    try {
      // Implementar download do certificado
      const response = await fetch(`/api/certificates/generate/${enrollment.id}`, {
        method: 'POST'
      })

      if (response.ok) {
        const responseData = await response.json()
        
        if (responseData.success) {
          // Por enquanto, exibir dados do certificado até implementar PDF
          alert(`Certificado gerado com sucesso!\n\nAluno: ${responseData.certificateData.studentName}\nCurso: ${responseData.certificateData.courseName}\nNúmero: ${responseData.certificateData.certificateNumber}\n\nEm breve será possível fazer download em PDF.`)
        } else {
          throw new Error(responseData.error || 'Erro ao gerar certificado')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar certificado')
      }
    } catch (error) {
      console.error('Erro ao baixar certificado:', error)
      alert('Erro ao baixar certificado. Tente novamente.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full p-3 bg-gray-100 rounded-lg flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-gray-600">Verificando elegibilidade...</span>
      </div>
    )
  }

  if (!enrollment.completed_at) {
    return (
      <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Certificado não disponível</span>
        </div>
        <p className="text-sm text-yellow-600 mt-1">
          Complete o curso para ter acesso ao certificado.
        </p>
      </div>
    )
  }

  if (isEligible) {
    return (
      <Button
        onClick={handleDownloadCertificate}
        disabled={downloading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        {downloading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Gerando Certificado...
          </>
        ) : (
          <>
            <Award className="w-5 h-5" />
            Baixar Certificado
          </>
        )}
      </Button>
    )
  }

  // Não elegível - mostrar motivo
  return (
    <div className="w-full space-y-3">
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Certificado não disponível</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{reason}</p>
      </div>

      {/* Avaliações pendentes */}
      {pendingEvaluations.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Avaliações Pendentes</span>
          </div>
          <ul className="text-sm text-blue-600 mt-2 space-y-1">
            {pendingEvaluations.map(evaluation => (
              <li key={evaluation.id} className="flex items-center gap-2">
                <Circle className="w-3 h-3" />
                {evaluation.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avaliações reprovadas */}
      {failedEvaluations.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Avaliações Reprovadas</span>
          </div>
          <ul className="text-sm text-orange-600 mt-2 space-y-1">
            {failedEvaluations.map(evaluation => (
              <li key={evaluation.id} className="flex items-center gap-2">
                <XCircle className="w-3 h-3" />
                {evaluation.title} (mínimo: {evaluation.passing_score}%)
              </li>
            ))}
          </ul>
          <p className="text-sm text-orange-600 mt-2">
            Refaça as avaliações para obter aprovação.
          </p>
        </div>
      )}
    </div>
  )
}