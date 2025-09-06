'use client'

import { useState } from 'react'
import { useCertificate } from '@/hooks/use-certificate'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { 
  Award, 
  Download, 
  Calendar, 
  Clock, 
  User,
  FileText,
  ExternalLink
} from 'lucide-react'

export function CertificatesList({ certificates: initialCertificates, user }) {
  const [certificates, setCertificates] = useState(initialCertificates)
  const { regenerateCertificate, loading } = useCertificate()
  const [regeneratingId, setRegeneratingId] = useState(null)

  const handleDownload = async (certificate) => {
    setRegeneratingId(certificate.id)
    try {
      const result = await regenerateCertificate(certificate.id)
      if (result.success) {
        // Certificado foi baixado automaticamente
      } else {
        alert(`Erro ao baixar certificado: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao baixar certificado:', error)
      alert('Erro inesperado ao baixar certificado')
    } finally {
      setRegeneratingId(null)
    }
  }


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (duration) => {
    if (!duration) return 'N/A'
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Certificados Obtidos
        </h2>
        <div className="text-sm text-gray-600">
          {certificates.length} certificado{certificates.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-6">
        {certificates.map((certificate) => (
          <Card key={certificate.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Award className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {certificate.course_name}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>Instrutor: {certificate.teacher_name}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Concluído em {formatDate(certificate.completion_date)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Duração: {formatDuration(certificate.courses?.duration)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>ID: {certificate.id}</span>
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Certificado emitido em {formatDate(certificate.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-6">
                <Button
                  onClick={() => handleDownload(certificate)}
                  disabled={loading || regeneratingId === certificate.id}
                  className="flex items-center gap-2"
                >
                  {regeneratingId === certificate.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Baixar
                    </>
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => window.open(`/verify/${certificate.id}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verificar
                </Button>

              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Informações sobre certificados */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Sobre os Certificados
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            • Os certificados são gerados automaticamente quando você completa um curso
          </p>
          <p>
            • Cada certificado possui um ID único para verificação de autenticidade
          </p>
          <p>
            • Você pode baixar seus certificados a qualquer momento
          </p>
          <p>
            • Use o botão &quot;Verificar&quot; para confirmar a autenticidade do certificado
          </p>
        </div>
      </Card>
    </div>
  )
}