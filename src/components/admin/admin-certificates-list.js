'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { useDeleteOperations } from '@/hooks/use-delete-operations'
import EditHistoricalCertificateModal from '@/components/admin/edit-historical-certificate-modal'
import { 
  Award, 
  FileText, 
  Calendar, 
  User,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileDown,
  Edit
} from 'lucide-react'

export default function AdminCertificatesList({ systemCertificates: initialSystemCerts, legacyCertificates: initialLegacyCerts, historicalCertificates: initialHistoricalCerts }) {
  const [activeTab, setActiveTab] = useState('system')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [systemCertificates, setSystemCertificates] = useState(initialSystemCerts)
  const [legacyCertificates, setLegacyCertificates] = useState(initialLegacyCerts)
  const [historicalCertificates, setHistoricalCertificates] = useState(initialHistoricalCerts || [])
  const [toggleLoading, setToggleLoading] = useState({})
  const [editingCertificate, setEditingCertificate] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { deleteCertificate, loading: deleteLoading } = useDeleteOperations()

  // Filtrar certificados baseado na busca
  const filterCertificates = (certificates) => {
    return certificates.filter(cert => {
      const matchesSearch = searchTerm === '' || 
        cert.nome_aluno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.cpf?.includes(searchTerm) ||
        cert.numero_certificado?.includes(searchTerm) ||
        cert.id?.includes(searchTerm)
      
      return matchesSearch
    })
  }

  const handleToggleStatus = async (certificateId, currentStatus, isSystemCert = false) => {
    setToggleLoading(prev => ({ ...prev, [certificateId]: true }))
    
    try {
      const response = await fetch('/api/admin/toggle-certificate-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateId,
          isActive: !currentStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        // Atualizar estado local
        if (isSystemCert) {
          setSystemCertificates(prev => 
            prev.map(cert => 
              cert.id === certificateId 
                ? { ...cert, is_active: !currentStatus } 
                : cert
            )
          )
        } else {
          setLegacyCertificates(prev => 
            prev.map(cert => 
              cert.id === certificateId 
                ? { ...cert, is_active: !currentStatus } 
                : cert
            )
          )
        }
      } else {
        alert('Erro ao alterar status: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao alterar status do certificado')
    } finally {
      setToggleLoading(prev => ({ ...prev, [certificateId]: false }))
    }
  }

  const handleDelete = async (certificateId, isHistorical = false) => {
    if (window.confirm('Tem certeza que deseja deletar este certificado?')) {
      const result = await deleteCertificate(certificateId, null, isHistorical)
      if (result.success) {
        alert('Certificado deletado com sucesso!')
        
        // Atualizar estado local ao invés de recarregar a página
        if (isHistorical) {
          setHistoricalCertificates(prev => prev.filter(cert => cert.id !== certificateId))
        } else {
          // Determinar se é certificado do sistema ou legado
          const isSystemCert = systemCertificates.some(cert => cert.id === certificateId)
          if (isSystemCert) {
            setSystemCertificates(prev => prev.filter(cert => cert.id !== certificateId))
          } else {
            setLegacyCertificates(prev => prev.filter(cert => cert.id !== certificateId))
          }
        }
      } else {
        alert('Erro ao deletar certificado: ' + result.error)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDuration = (duration) => {
    if (!duration) return 'N/A'
    return `${duration}h`
  }

  const formatCPF = (cpf) => {
    if (!cpf) return 'N/A'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const systemCertsFiltered = filterCertificates(systemCertificates)
  const legacyCertsFiltered = filterCertificates(legacyCertificates)

  return (
    <div className="space-y-6">
      {/* Header com Abas */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-initial min-h-[44px] ${
                activeTab === 'system' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Certificados do Sistema ({systemCertificates.length})
            </button>
            <button
              onClick={() => setActiveTab('legacy')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-initial min-h-[44px] ${
                activeTab === 'legacy' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Certificados Legados ({legacyCertificates.length})
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-initial min-h-[44px] ${
                activeTab === 'historical' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Certificados Históricos ({historicalCertificates.length})
            </button>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nome, CPF ou número do certificado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </Card>

      {/* Lista de Certificados do Sistema */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Certificados Emitidos pelo Sistema
          </h2>
          
          {systemCertsFiltered.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Nenhum certificado encontrado com os filtros aplicados' : 'Nenhum certificado do sistema ainda'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Versão Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {systemCertsFiltered.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{cert.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500">{formatCPF(cert.profiles?.cpf)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{cert.courses?.title}</p>
                            <p className="text-sm text-gray-500">{formatDuration(cert.courses?.duration)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">{formatDate(cert.created_at)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={cert.is_active !== false}
                              onChange={() => handleToggleStatus(cert.id, cert.is_active !== false, true)}
                              disabled={toggleLoading[cert.id]}
                            />
                            <div className={`w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${cert.is_active !== false ? 'bg-green-600 after:translate-x-full' : 'bg-gray-200'}`}></div>
                          </label>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {cert.certificate_url && (
                              <a
                                href={cert.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Download PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </a>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(`/verify/${cert.id}`, '_blank')}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(cert.id)}
                              disabled={deleteLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile */}
              <div className="md:hidden space-y-4">
                {systemCertsFiltered.map((cert) => (
                  <Card key={cert.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cert.profiles?.full_name}</p>
                          <p className="text-sm text-gray-500">{formatCPF(cert.profiles?.cpf)}</p>
                        </div>
                        <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">{cert.courses?.title}</p>
                        <p className="text-xs text-gray-500">{formatDuration(cert.courses?.duration)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(cert.created_at)}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={cert.is_active !== false}
                            onChange={() => handleToggleStatus(cert.id, cert.is_active !== false, true)}
                            disabled={toggleLoading[cert.id]}
                          />
                          <div className={`w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${cert.is_active !== false ? 'bg-green-600 after:translate-x-full' : 'bg-gray-200'}`}></div>
                        </label>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {cert.certificate_url && (
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            PDF
                          </a>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/verify/${cert.id}`, '_blank')}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cert.id)}
                          disabled={deleteLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de Certificados Legados */}
      {activeTab === 'legacy' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Certificados Legados (Importados)
          </h2>
          
          {legacyCertsFiltered.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Nenhum certificado encontrado com os filtros aplicados' : 'Nenhum certificado legado importado ainda'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Versão Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {legacyCertsFiltered.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{cert.nome_aluno}</p>
                            <p className="text-sm text-gray-500">{formatCPF(cert.cpf)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{cert.nome_curso}</p>
                            <p className="text-sm text-gray-500">{cert.carga_horaria}h</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-mono text-gray-600">{cert.numero_certificado}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">{formatDate(cert.data_conclusao)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={cert.is_active !== false}
                              onChange={() => handleToggleStatus(cert.id, cert.is_active !== false, false)}
                              disabled={toggleLoading[cert.id]}
                            />
                            <div className={`w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${cert.is_active !== false ? 'bg-green-600 after:translate-x-full' : 'bg-gray-200'}`}></div>
                          </label>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {cert.pdf_url && (
                              <a
                                href={cert.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Download PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </a>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(cert.id)}
                              disabled={deleteLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile */}
              <div className="md:hidden space-y-4">
                {legacyCertsFiltered.map((cert) => (
                  <Card key={cert.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cert.nome_aluno}</p>
                          <p className="text-sm text-gray-500">{formatCPF(cert.cpf)}</p>
                        </div>
                        <FileText className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">{cert.nome_curso}</p>
                        <p className="text-xs text-gray-500">{cert.carga_horaria}h</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Certificado:</p>
                        <p className="text-sm font-mono text-gray-600">{cert.numero_certificado}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(cert.data_conclusao)}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={cert.is_active !== false}
                            onChange={() => handleToggleStatus(cert.id, cert.is_active !== false, false)}
                            disabled={toggleLoading[cert.id]}
                          />
                          <div className={`w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${cert.is_active !== false ? 'bg-green-600 after:translate-x-full' : 'bg-gray-200'}`}></div>
                        </label>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        {cert.pdf_url && (
                          <a
                            href={cert.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            PDF
                          </a>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cert.id)}
                          disabled={deleteLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de Certificados Históricos */}
      {activeTab === 'historical' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Certificados Históricos (Simplificados)
          </h2>

          {filterCertificates(historicalCertificates).length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Nenhum certificado histórico encontrado para sua busca' : 'Nenhum certificado histórico cadastrado'}
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  Limpar busca
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filterCertificates(historicalCertificates).map(cert => (
                <Card key={cert.id} className="p-4">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate">
                            {cert.student_name || cert.nome_aluno}
                          </h3>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Histórico
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>CPF: {cert.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{cert.course_name || cert.nome_curso}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(cert.data_conclusao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {cert.numero_certificado && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>Nº {cert.numero_certificado}</span>
                          </div>
                        )}
                        {cert.carga_horaria && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{cert.carga_horaria}h</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {cert.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600">Ativo</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="text-red-600">Inativo</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(cert.certificate_url || cert.pdf_url) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(cert.certificate_url || cert.pdf_url, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingCertificate(cert)
                          setIsEditModalOpen(true)
                        }}
                        className="flex items-center gap-1"
                        title="Editar certificado"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(cert.id, true)}
                        disabled={deleteLoading}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {deleteLoading === cert.id ? 'Excluindo...' : 'Excluir'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição */}
      <EditHistoricalCertificateModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCertificate(null)
        }}
        certificate={editingCertificate}
        onSuccess={() => {
          // Recarregar dados após edição
          window.location.reload()
        }}
      />
    </div>
  )
}