'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Save, Loader2, FileText, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatCPF } from '@/lib/utils'

export default function EditHistoricalCertificateModal({ 
  isOpen, 
  onClose, 
  certificate, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    nome_aluno: '',
    cpf: '',
    numero_certificado: '',
    nome_curso: '',
    carga_horaria: '',
    data_conclusao: '',
    pdf_url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)

  // Preencher dados quando o certificado mudar
  useEffect(() => {
    if (certificate) {
      setFormData({
        nome_aluno: certificate.student_name || certificate.nome_aluno || '',
        cpf: certificate.cpf || '',
        numero_certificado: certificate.certificate_number || certificate.numero_certificado || '',
        nome_curso: certificate.course_name || certificate.nome_curso || '',
        carga_horaria: certificate.workload || certificate.carga_horaria || '',
        data_conclusao: certificate.data_conclusao ? 
          new Date(certificate.data_conclusao).toISOString().split('T')[0] : '',
        pdf_url: certificate.certificate_url || certificate.pdf_url || ''
      })
      setPdfFile(null)
    }
  }, [certificate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'cpf') {
      // Remover formatação para salvar apenas números
      const cleanCpf = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [name]: cleanCpf }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePdfChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, selecione apenas arquivos PDF')
        return
      }
      setPdfFile(file)
      setError('')
    }
  }

  const uploadPdf = async () => {
    if (!pdfFile || !certificate) return null

    setIsUploadingPdf(true)
    try {
      // Criar nome único para o arquivo
      const fileName = `historical-${certificate.id}-${Date.now()}.pdf`
      
      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, pdfFile)

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        throw new Error('Erro ao fazer upload do PDF')
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload do PDF:', err)
      setError(err.message)
      return null
    } finally {
      setIsUploadingPdf(false)
    }
  }

  const removePdf = async () => {
    if (!formData.certificate_url) return

    try {
      // Extrair nome do arquivo da URL
      const urlParts = formData.certificate_url.split('/')
      const fileName = urlParts[urlParts.length - 1]

      // Remover do storage
      if (fileName && fileName.startsWith('historical-')) {
        await supabase.storage
          .from('certificates')
          .remove([fileName])
      }

      // Limpar URL no formulário
      setFormData(prev => ({ ...prev, certificate_url: '' }))
      setPdfFile(null)
    } catch (err) {
      console.error('Erro ao remover PDF:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!certificate) return
    
    setIsSubmitting(true)
    setError('')

    try {
      let pdfUrl = formData.certificate_url

      // Upload do novo PDF se selecionado
      if (pdfFile) {
        const uploadedUrl = await uploadPdf()
        if (uploadedUrl) {
          pdfUrl = uploadedUrl
        }
      }

      // Preparar dados para atualização
      const updateData = {
        nome_aluno: formData.nome_aluno.trim(),
        cpf: formData.cpf.replace(/\D/g, ''), // Apenas números
        numero_certificado: formData.numero_certificado.trim(),
        nome_curso: formData.nome_curso.trim(),
        carga_horaria: parseInt(formData.carga_horaria) || 0,
        data_conclusao: formData.data_conclusao,
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString()
      }

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('certificados_antigos')
        .update(updateData)
        .eq('id', certificate.id)

      if (updateError) throw updateError

      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess()
      }

      // Limpar e fechar
      setFormData({
        nome_aluno: '',
        cpf: '',
        numero_certificado: '',
        nome_curso: '',
        carga_horaria: '',
        data_conclusao: '',
        pdf_url: ''
      })
      setPdfFile(null)
      onClose()
    } catch (err) {
      console.error('Erro ao atualizar certificado:', err)
      setError(err.message || 'Erro ao atualizar certificado')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Certificado Histórico
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Nome do Aluno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Aluno *
            </label>
            <input
              type="text"
              name="nome_aluno"
              value={formData.nome_aluno}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF *
            </label>
            <input
              type="text"
              name="cpf"
              value={formatCPF(formData.cpf)}
              onChange={handleInputChange}
              required
              maxLength="14"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
            />
          </div>

          {/* Número do Certificado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Certificado *
            </label>
            <input
              type="text"
              name="numero_certificado"
              value={formData.numero_certificado}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: HIST-2024-001"
            />
          </div>

          {/* Nome do Curso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Curso *
            </label>
            <input
              type="text"
              name="nome_curso"
              value={formData.nome_curso}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Carga Horária */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carga Horária (horas) *
              </label>
              <input
                type="number"
                name="carga_horaria"
                value={formData.carga_horaria}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data de Conclusão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Conclusão *
              </label>
              <input
                type="date"
                name="data_conclusao"
                value={formData.data_conclusao}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Upload de PDF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificado PDF
            </label>
            
            {formData.pdf_url && !pdfFile ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">PDF anexado</span>
                  <a 
                    href={formData.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline ml-2"
                  >
                    Visualizar
                  </a>
                </div>
                <button
                  type="button"
                  onClick={removePdf}
                  className="text-red-600 hover:text-red-700"
                  title="Remover PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {pdfFile && (
                  <p className="mt-1 text-sm text-green-600">
                    Arquivo selecionado: {pdfFile.name}
                  </p>
                )}
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Opcional: Anexe o PDF do certificado para download
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingPdf}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {(isSubmitting || isUploadingPdf) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isUploadingPdf ? 'Enviando PDF...' : isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}