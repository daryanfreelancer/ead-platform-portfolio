'use client'

import { useState } from 'react'
import { X, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { formatCPF } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function AddLegacyCertificateModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const [formData, setFormData] = useState({
    nome_aluno: '',
    cpf: '',
    numero_certificado: '',
    nome_curso: '',
    carga_horaria: '',
    data_conclusao: ''
  })
  const [submitAttempts, setSubmitAttempts] = useState(0)

  if (!isOpen) return null

  // Função para reset completo do estado
  const resetModalState = () => {
    console.log('Certificado - Resetando estado completo')
    setLoading(false)
    setPdfFile(null)
    setSubmitAttempts(0)
    setFormData({
      nome_aluno: '',
      cpf: '',
      numero_certificado: '',
      nome_curso: '',
      carga_horaria: '',
      data_conclusao: ''
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCPFChange = (e) => {
    const cleanValue = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({
      ...prev,
      cpf: cleanValue
    }))
  }

  const handlePdfUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else {
      alert('Por favor, selecione apenas arquivos PDF')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Debounce: Impedir múltiplos submits rápidos
    if (loading) {
      console.log('Submit ignorado - já processando')
      return
    }

    // Incrementar tentativas para debug
    setSubmitAttempts(prev => prev + 1)
    console.log(`Certificado - Tentativa de submit #${submitAttempts + 1}`)
    
    setLoading(true)

    try {
      // Validações
      if (formData.cpf.length !== 11) {
        alert('CPF deve ter 11 dígitos')
        setLoading(false)
        return
      }

      if (!formData.carga_horaria || parseInt(formData.carga_horaria) <= 0) {
        alert('Carga horária deve ser maior que zero')
        setLoading(false)
        return
      }

      let pdfUrl = null

      console.log('Certificado - Iniciando processamento')

      // Upload do PDF se fornecido
      if (pdfFile) {
        console.log('Certificado - Fazendo upload do PDF')
        const fileName = `${formData.numero_certificado}-${Date.now()}.pdf`
        const { data, error } = await supabase.storage
          .from('certificates')
          .upload(fileName, pdfFile)

        if (error) {
          console.error('Certificado - Erro no upload:', error)
          throw new Error(`Erro ao fazer upload do PDF: ${error.message}`)
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName)
        
        pdfUrl = publicUrl
        console.log('Certificado - Upload concluído:', pdfUrl)
      }

      // Criar certificado legado
      const certificateData = {
        id: `LEGACY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nome_aluno: formData.nome_aluno.trim(),
        cpf: formData.cpf,
        numero_certificado: formData.numero_certificado.trim(),
        nome_curso: formData.nome_curso.trim(),
        carga_horaria: parseInt(formData.carga_horaria),
        data_conclusao: formData.data_conclusao,
        pdf_url: pdfUrl,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Certificado - Enviando para API:', certificateData)

      const response = await fetch('/api/admin/create-historical-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certificate: certificateData })
      })

      console.log('Certificado - Resposta da API recebida:', response.status)
      
      const result = await response.json()
      console.log('Certificado - Resultado da API:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar certificado')
      }

      console.log('Certificado - Sucesso! Limpando estado...')
      
      // Reset completo do estado
      resetModalState()
      
      alert('Certificado histórico criado com sucesso!')
      
      // Chamar onSuccess para refresh da página
      console.log('Certificado - Chamando onSuccess para refresh')
      onSuccess()
      
      // onSuccess já fechará o modal após o refresh
    } catch (error) {
      console.error('Certificado - Erro capturado:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      console.log('Certificado - Finalizando submit, setLoading(false)')
      setLoading(false)
    }
  }

  const handleClose = () => {
    console.log('Certificado - HandleClose chamado')
    resetModalState()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Adicionar Certificado Legado
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Aluno */}
              <div className="md:col-span-2">
                <Label htmlFor="nome_aluno">Nome do Aluno *</Label>
                <Input
                  id="nome_aluno"
                  name="nome_aluno"
                  value={formData.nome_aluno}
                  onChange={handleChange}
                  required
                  placeholder="Nome completo do aluno"
                  autocomplete="name"
                  aria-describedby="nome_aluno_help"
                />
              </div>

              {/* CPF */}
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  required
                  placeholder="00000000000"
                  autocomplete="off"
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  aria-describedby="cpf_help"
                />
                <p id="cpf_help" className="text-xs text-gray-500 mt-1">
                  {formatCPF(formData.cpf)}
                </p>
              </div>

              {/* Número do Certificado */}
              <div>
                <Label htmlFor="numero_certificado">Número do Certificado *</Label>
                <Input
                  id="numero_certificado"
                  name="numero_certificado"
                  value={formData.numero_certificado}
                  onChange={handleChange}
                  required
                  placeholder="CERT-2024-001"
                  autocomplete="off"
                />
              </div>

              {/* Nome do Curso */}
              <div className="md:col-span-2">
                <Label htmlFor="nome_curso">Nome do Curso *</Label>
                <Input
                  id="nome_curso"
                  name="nome_curso"
                  value={formData.nome_curso}
                  onChange={handleChange}
                  required
                  placeholder="Nome completo do curso"
                  autocomplete="off"
                />
              </div>

              {/* Carga Horária */}
              <div>
                <Label htmlFor="carga_horaria">Carga Horária (horas) *</Label>
                <Input
                  id="carga_horaria"
                  name="carga_horaria"
                  type="number"
                  value={formData.carga_horaria}
                  onChange={handleChange}
                  required
                  min="1"
                  max="9999"
                  placeholder="120"
                  autocomplete="off"
                  inputMode="numeric"
                />
              </div>

              {/* Data de Conclusão */}
              <div>
                <Label htmlFor="data_conclusao">Data de Conclusão *</Label>
                <Input
                  id="data_conclusao"
                  name="data_conclusao"
                  type="date"
                  value={formData.data_conclusao}
                  onChange={handleChange}
                  required
                  autocomplete="off"
                />
              </div>

              {/* Upload de PDF */}
              <div className="md:col-span-2">
                <Label htmlFor="pdf">Certificado PDF (opcional)</Label>
                <div className="mt-2">
                  {pdfFile ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 flex-1">
                        {pdfFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Clique para anexar PDF do certificado
                      </span>
                      <input
                        id="pdf"
                        name="certificado_pdf"
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        aria-describedby="pdf_help"
                      />
                    </label>
                  )}
                  <p id="pdf_help" className="text-xs text-gray-500 mt-2">
                    Arquivo PDF opcional do certificado (máximo 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
                aria-label="Cancelar cadastro de certificado"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
                aria-label={loading ? 'Salvando certificado histórico' : 'Salvar certificado histórico'}
              >
                {loading ? 'Salvando...' : 'Salvar Certificado Histórico'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}