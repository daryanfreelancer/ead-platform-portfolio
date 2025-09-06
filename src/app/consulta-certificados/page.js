'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatCPF, formatDate } from '@/lib/utils'
import MaintenanceMessage from '@/components/ui/maintenance-message'
import MaintenanceBanner from '@/components/ui/maintenance-banner'
import { isFeatureAvailable } from '@/lib/config/maintenance'

export default function ConsultaCertificadosPage() {
  const [cpf, setCpf] = useState('')
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20 // Carregar 20 certificados por vez

  // Verificar se a consulta de certificados está disponível
  if (!isFeatureAvailable('publicCertificateSearchDisabled')) {
    return (
      <MaintenanceMessage
        title="Consulta de Certificados Temporariamente Indisponível"
        message="A consulta pública de certificados por CPF está temporariamente indisponível para manutenção e melhorias na plataforma. O sistema será reativado no dia 19 de julho de 2025."
        showBackButton={true}
        backUrl="/"
      />
    )
  }

  // Verificar parâmetros da URL e executar busca automática
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const cpfParam = urlParams.get('cpf')
    
    if (cpfParam && cpfParam.length === 11) {
      // CPF válido nos parâmetros, executar busca automática
      setCpf(cpfParam)
      
      // Aguardar um momento para o estado ser atualizado, então buscar
      setTimeout(() => {
        searchCertificates(null, false, true) // skipValidation = true
      }, 100)
    }
  }, [])

  const handleCpfChange = (e) => {
    // Remove tudo que não é número
    const cleanValue = e.target.value.replace(/\D/g, '')
    setCpf(cleanValue)
  }

  const searchCertificates = async (e, isLoadMore = false, skipValidation = false) => {
    if (e) e.preventDefault()
    
    // Só validar se não for busca automática via URL
    if (!skipValidation && cpf.length !== 11) {
      alert('CPF deve ter 11 dígitos')
      return
    }

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setSearched(true)
      setOffset(0)
      setCertificates([])
    }
    
    try {
      // Formatar CPF para busca (certificados podem estar salvos em formatos diferentes)
      const cpfFormatted = formatCPF(cpf) // Com pontos e hífen
      
      // Executar todas as queries em paralelo com Promise.all
      const [currentCertsResponse, legacyCertsResponse, historicalCertsResponse] = await Promise.all([
        // Buscar certificados atuais (de cursos concluídos)
        supabase
          .from('enrollments')
          .select(`
            id,
            completed_at,
            certificate_url,
            courses!inner (
              title,
              duration
            ),
            profiles!inner (
              full_name,
              cpf
            )
          `, { count: 'exact' })
          .eq('profiles.cpf', cpfFormatted)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false }),

        // Buscar certificados legados ativos (tabela híbrida)
        supabase
          .from('legacy_certificates')
          .select('*', { count: 'exact' })
          .eq('cpf', cpfFormatted)
          .eq('is_active', true)
          .order('completion_date', { ascending: false, nullsFirst: false }),

        // Buscar certificados históricos ativos (nova tabela)
        supabase
          .from('certificados_antigos')
          .select('*', { count: 'exact' })
          .eq('cpf', cpf)
          .eq('is_active', true)
          .order('data_conclusao', { ascending: false, nullsFirst: false })
      ])

      const currentCerts = currentCertsResponse.data || []
      const legacyCerts = legacyCertsResponse.data || []
      const historicalCerts = historicalCertsResponse.data || []

      // Combinar e formatar resultados
      const allCertificates = [
        ...(currentCerts).map(cert => ({
          id: cert.id,
          type: 'current',
          full_name: cert.profiles.full_name,
          cpf: cert.profiles.cpf,
          course_name: cert.courses.title,
          completion_date: cert.completed_at,
          workload: cert.courses.duration ? Math.floor(cert.courses.duration / 60) : null,
          certificate_url: `/certificados/${cert.id}`, // URL dinâmica para certificados do sistema
          start_date: null,
          end_date: null,
          registration_number: null
        })),
        ...(legacyCerts).map(cert => ({
          id: cert.id,
          type: 'legacy',
          full_name: cert.nome_aluno || cert.student_name,
          cpf: cert.cpf,
          course_name: cert.nome_curso || cert.course_name,
          completion_date: cert.data_conclusao || cert.completion_date,
          workload: cert.carga_horaria,
          certificate_url: cert.pdf_url || null, // Usar pdf_url como certificate_url para legados
          start_date: null,
          end_date: cert.data_conclusao || cert.completion_date,
          registration_number: cert.numero_certificado || null
        })),
        ...(historicalCerts).map(cert => ({
          id: cert.id,
          type: 'historical',
          full_name: cert.nome_aluno,
          cpf: cert.cpf,
          course_name: cert.nome_curso,
          completion_date: cert.data_conclusao,
          workload: cert.carga_horaria,
          certificate_url: cert.pdf_url || null,
          start_date: null,
          end_date: cert.data_conclusao,
          registration_number: cert.numero_certificado
        }))
      ]

      // Ordenar todos os certificados por data de conclusão (mais recentes primeiro)
      allCertificates.sort((a, b) => {
        const dateA = new Date(a.completion_date || 0)
        const dateB = new Date(b.completion_date || 0)
        return dateB - dateA
      })

      // Aplicar paginação
      const currentOffset = isLoadMore ? offset : 0
      const paginatedCertificates = allCertificates.slice(currentOffset, currentOffset + LIMIT)
      const totalCertificates = allCertificates.length
      
      if (isLoadMore) {
        setCertificates(prev => [...prev, ...paginatedCertificates])
      } else {
        setCertificates(paginatedCertificates)
      
      // Debug seguro apenas no cliente (desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Certificados carregados:', paginatedCertificates.map(cert => ({ 
          type: cert.type, 
          hasUrl: !!cert.certificate_url,
          hasCompletionDate: !!cert.completion_date,
          id: cert.id.substring(0, 8) + '...' // Apenas parte do ID
        })))
      }
      }
      
      setOffset(currentOffset + paginatedCertificates.length)
      setHasMore(currentOffset + paginatedCertificates.length < totalCertificates)
    } catch (error) {
      console.error('Erro ao buscar certificados:', error)
      alert('Erro ao buscar certificados. Tente novamente.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleShareCertificate = async (certificate) => {
    const shareData = {
      title: `Certificado EduPlatform - ${certificate.course_name}`,
      text: `Certificado de conclusão do curso "${certificate.course_name}" emitido pelo Instituto EduPlatform`,
      url: `${window.location.origin}/verify/${certificate.id}`
    }

    try {
      // Verificar se o navegador suporta Web Share API
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(shareData.url)
        alert('Link do certificado copiado para a área de transferência!')
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      // Fallback manual
      const textArea = document.createElement('textarea')
      textArea.value = shareData.url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Link do certificado copiado para a área de transferência!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Banner de Manutenção */}
      <MaintenanceBanner />
      
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Consulta de Certificados
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Digite seu CPF para consultar todos os seus certificados emitidos pelo EduPlatform. 
          Esta consulta é pública e gratuita.
        </p>
      </div>
      
      {/* Formulário de Busca */}
<Card className="mb-8">
  <CardContent className="p-6">
    <form onSubmit={searchCertificates}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="cpf">CPF (apenas números)</Label>
          <div className="mt-2">
            <Input
              id="cpf"
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="12345678901"
              className="text-lg w-full"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Formato: {formatCPF(cpf) || '000.000.000-00'}
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={loading || cpf.length !== 11}
            size="lg"
            className="w-full sm:w-auto px-8 min-h-[44px]"
          >
            {loading ? 'Buscando...' : 'Consultar Certificados'}
          </Button>
        </div>
      </div>
    </form>
  </CardContent>
</Card>

      {/* Resultados */}
      {searched && (
        <div className="space-y-6">
          {certificates.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Certificados Encontrados {hasMore && `(${certificates.length}+)`}
                </h2>
                <div className="text-sm text-gray-600">
                  CPF: {formatCPF(cpf)}
                </div>
              </div>
              
              {certificates.map((certificate) => (
                <CertificateCard 
                  key={`${certificate.type}-${certificate.id}`} 
                  certificate={certificate}
                  onShare={handleShareCertificate}
                  cpf={cpf}
                />
              ))}
              
              {/* Botão Carregar Mais */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => searchCertificates(null, true)}
                    disabled={loadingMore}
                    size="lg"
                    variant="outline"
                    className="min-h-[44px] px-8"
                  >
                    {loadingMore ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Carregando mais...
                      </>
                    ) : (
                      '📋 Carregar Mais Certificados'
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Mostrando {certificates.length} certificados
                  </p>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum certificado encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Não foram encontrados certificados para o CPF {formatCPF(cpf)}
                </p>
                <div className="text-sm text-gray-500 max-w-md mx-auto">
                  <p className="mb-2">Verifique se:</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>O CPF foi digitado corretamente</li>
                    <li>Você possui cursos concluídos no EduPlatform</li>
                    <li>Os certificados foram emitidos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para exibir cada certificado
const CertificateCard = ({ certificate, onShare, cpf }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {certificate.course_name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              certificate.type === 'current' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {certificate.type === 'current' ? 'Atual' : 'Histórico'}
            </span>
            {certificate.certificate_url && (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                PDF Disponível
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações do Aluno */}
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Nome:</span>
              <p className="text-gray-900">{certificate.full_name}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">CPF:</span>
              <p className="text-gray-900">{formatCPF(certificate.cpf)}</p>
            </div>
            
            {certificate.registration_number && (
              <div>
                <span className="text-sm font-medium text-gray-600">Número de Registro:</span>
                <p className="text-gray-900 font-mono">{certificate.registration_number}</p>
              </div>
            )}
          </div>

          {/* Informações do Curso */}
          <div className="space-y-3">
            {certificate.start_date && certificate.end_date ? (
              <div>
                <span className="text-sm font-medium text-gray-600">Período:</span>
                <p className="text-gray-900">
                  {formatDate(certificate.start_date)} até {formatDate(certificate.end_date)}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-gray-600">Data de Conclusão:</span>
                <p className="text-gray-900">
                  {formatDate(certificate.completion_date)}
                </p>
              </div>
            )}
            
            {certificate.workload && (
              <div>
                <span className="text-sm font-medium text-gray-600">Carga Horária:</span>
                <p className="text-gray-900">{certificate.workload} horas</p>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <p className="text-green-600 font-medium">✅ Concluído</p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {(certificate.type === 'current' || certificate.type === 'legacy') || certificate.certificate_url ? (
              <a
                href={
                  certificate.type === 'current' || certificate.type === 'legacy' 
                    ? `/api/certificates/${certificate.id}/download` 
                    : certificate.certificate_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center font-medium min-h-[44px] flex items-center justify-center"
              >
                📄 Download Certificado PDF
              </a>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-center min-h-[44px] flex items-center justify-center">
                📋 PDF não disponível
              </div>
            )}
            
            <a
              href={`/verify/${certificate.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center"
            >
              ✅ Verificar
            </a>
            
            <button 
              onClick={() => onShare(certificate)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] flex items-center justify-center"
            >
              🔗 Compartilhar
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
