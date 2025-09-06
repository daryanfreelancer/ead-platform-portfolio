'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/button'

export default function ImportCatalogModal({ isOpen, onClose, onSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [errors, setErrors] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (files) => {
    const file = files[0]
    
    if (!file) return

    // Verificar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      setErrors(['Formato de arquivo inválido. Use apenas arquivos .xlsx ou .xls'])
      return
    }

    uploadFile(file)
  }

  const uploadFile = async (file) => {
    try {
      setIsUploading(true)
      setErrors(null)
      setUploadResults(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/import-catalog', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar arquivo')
      }

      setUploadResults(result)
      
      // Notificar sucesso para o componente pai
      if (result.courses) {
        onSuccess(result.courses)
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      setErrors([error.message])
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect(files)
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/import-template')
      
      if (!response.ok) throw new Error('Erro ao baixar template')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template-importacao-cursos.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar template:', error)
      setErrors(['Erro ao baixar template do Excel'])
    }
  }

  const handleClose = () => {
    setUploadResults(null)
    setErrors(null)
    setIsUploading(false)
    onClose()
  }

  const resetForm = () => {
    setUploadResults(null)
    setErrors(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Importar Catálogo de Cursos
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Template Download */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">Template Excel</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Baixe o template para ver o formato correto dos dados. 
                  Campos obrigatórios: <strong>nome_curso</strong> e <strong>categoria</strong>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Template
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!uploadResults && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                isDragging ? 'text-blue-500' : 'text-gray-400'
              }`} />
              
              {isUploading ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Processando arquivo...</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto">
                    <div className="h-2 bg-blue-600 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isDragging ? 'Solte o arquivo aqui' : 'Selecione ou arraste o arquivo Excel'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Formatos suportados: .xlsx, .xls
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Selecionar Arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </>
              )}
            </div>
          )}

          {/* Results */}
          {uploadResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Importação Concluída!</h3>
                  <p className="text-sm text-green-700">
                    {uploadResults.imported} cursos importados com sucesso
                    {uploadResults.duplicates > 0 && 
                      ` (${uploadResults.duplicates} duplicatas ignoradas)`
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={resetForm} variant="secondary">
                  Importar Mais Cursos
                </Button>
                <Button onClick={handleClose}>
                  Concluir
                </Button>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-medium text-red-900">Erro na Importação</h3>
                  {Array.isArray(errors) ? (
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-700">{errors}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!uploadResults && !isUploading && (
            <div className="mt-6 text-sm text-gray-600 space-y-2">
              <h4 className="font-medium">Instruções:</h4>
              <ul className="space-y-1 pl-4">
                <li>• Linhas vazias serão automaticamente ignoradas</li>
                <li>• Cursos duplicados (mesmo nome) serão ignorados</li>
                <li>• Categorias válidas: Capacitação, Tecnólogo, Bacharel, Licenciatura, etc.</li>
                <li>• Campo subcategoria é opcional</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}