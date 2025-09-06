import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  User,
  FileText,
  Shield
} from 'lucide-react'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function VerifyPage({ params }) {
  const supabase = await createClient()

  // Buscar certificado por ID ou enrollment_id
  let certificate = null
  let error = null

  // Primeiro tenta buscar por ID do certificado
  const { data: certById, error: errorById } = await supabase
    .from('legacy_certificates')
    .select(`
      *,
      courses (
        title,
        duration,
        profiles!teacher_id (
          full_name
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (certById && !errorById) {
    certificate = certById
  } else {
    // Se não encontrou por ID, tenta buscar por enrollment_id
    const { data: certByEnrollment, error: errorByEnrollment } = await supabase
      .from('legacy_certificates')
      .select(`
        *,
        courses (
          title,
          duration,
          profiles!teacher_id (
            full_name
          )
        )
      `)
      .eq('enrollment_id', params.id)
      .single()

    if (certByEnrollment && !errorByEnrollment) {
      certificate = certByEnrollment
    } else {
      // Se ainda não encontrou, tenta buscar em certificados_antigos
      const { data: certAntigo, error: errorAntigo } = await supabase
        .from('certificados_antigos')
        .select('*')
        .eq('id', params.id)
        .eq('is_active', true)
        .single()

      if (certAntigo && !errorAntigo) {
        // Formatar dados de certificados_antigos para o formato esperado
        certificate = {
          id: certAntigo.id,
          student_name: certAntigo.nome_aluno,
          cpf: certAntigo.cpf,
          course_name: certAntigo.nome_curso,
          completion_date: certAntigo.data_conclusao,
          teacher_name: certAntigo.nome_instrutor || 'EduPlatform',
          created_at: certAntigo.created_at,
          courses: {
            duration: certAntigo.carga_horaria ? certAntigo.carga_horaria * 60 : null, // Converter horas para minutos
            title: certAntigo.nome_curso
          }
        }
      } else {
        error = errorAntigo || errorByEnrollment || errorById
      }
    }
  }

  const isValid = !error && certificate

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verificação de Certificado
          </h1>
          <p className="text-gray-600">
            Confirme a autenticidade do certificado EduPlatform
          </p>
        </div>

        {/* Status da Verificação */}
        <Card className={`p-8 mb-8 ${isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center justify-center mb-4">
            {isValid ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-2 ${isValid ? 'text-green-900' : 'text-red-900'}`}>
              {isValid ? 'Certificado Válido' : 'Certificado Inválido'}
            </h2>
            <p className={`text-lg ${isValid ? 'text-green-700' : 'text-red-700'}`}>
              {isValid 
                ? 'Este certificado é autêntico e foi emitido pela EduPlatform'
                : 'Este certificado não foi encontrado em nossa base de dados'
              }
            </p>
          </div>
        </Card>

        {/* Detalhes do Certificado */}
        {isValid && (
          <div className="space-y-6">
            <Card className="p-8">
              <div className="text-center mb-6">
                <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {certificate.course_name}
                </h3>
                <p className="text-gray-600">
                  Certificado de Conclusão
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Informações do Estudante
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Nome</p>
                        <p className="text-gray-600">{certificate.student_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">CPF</p>
                        <p className="text-gray-600">{certificate.cpf}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Data de Conclusão</p>
                        <p className="text-gray-600">{formatDate(certificate.completion_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Informações do Curso
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Instrutor</p>
                        <p className="text-gray-600">{certificate.teacher_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Duração</p>
                        <p className="text-gray-600">{formatDuration(certificate.courses?.duration)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Informações de Autenticidade */}
            <Card className="p-8 bg-blue-50 border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">
                🔒 Informações de Autenticidade
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">ID do Certificado</p>
                    <p className="text-blue-700 font-mono text-sm">{certificate.id}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">Data de Emissão</p>
                    <p className="text-blue-700">{formatDate(certificate.created_at)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verificação Digital */}
            <Card className="p-8 bg-green-50 border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-4">
                ✅ Verificação Digital
              </h4>
              <div className="space-y-2 text-sm text-green-800">
                <p>• Este certificado foi verificado digitalmente em nossa base de dados</p>
                <p>• A autenticidade foi confirmada em {new Date().toLocaleString('pt-BR')}</p>
                <p>• Certificado emitido pela EduPlatform - Plataforma EAD</p>
                <p>• Para mais informações, acesse: {typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_URL || 'https://eduplatform.com.br'}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Certificado Inválido */}
        {!isValid && (
          <Card className="p-8 bg-red-50 border-red-200">
            <h4 className="text-lg font-semibold text-red-900 mb-4">
              ⚠️ Certificado Não Encontrado
            </h4>
            <div className="space-y-2 text-sm text-red-800">
              <p>• O ID do certificado fornecido não foi encontrado em nossa base de dados</p>
              <p>• Verifique se o ID foi digitado corretamente</p>
              <p>• Caso tenha dúvidas, entre em contato conosco</p>
            </div>
          </Card>
        )}

        {/* Rodapé */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            © 2024 EduPlatform - Sistema de Verificação de Certificados
          </p>
        </div>
      </div>
    </div>
  )
}