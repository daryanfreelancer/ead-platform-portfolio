'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, FileText, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase/client'

export default function BulkCertificateImport() {
  const [file, setFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fullData, setFullData] = useState(null) // Todos os dados do arquivo
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfFiles, setPdfFiles] = useState({})
  const itemsPerPage = 10 // Mostrar 10 itens por página

  // Validar estrutura do arquivo Excel
  const validateExcelStructure = (data) => {
    const requiredColumns = [
      'nome_aluno',
      'cpf', 
      'numero_certificado',
      'nome_curso',
      'carga_horaria',
      'data_conclusao'
    ]

    if (!data || data.length === 0) {
      throw new Error('Arquivo Excel está vazio')
    }

    const headers = Object.keys(data[0])
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`)
    }

    return true
  }

  // Processar arquivo Excel
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setResults(null)
    setPdfFiles({}) // Limpar PDFs anteriores

    // Verificar extensão do arquivo
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = uploadedFile.name.toLowerCase().slice(-5)
    
    if (!validExtensions.some(ext => fileExtension.includes(ext))) {
      alert('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Validar estrutura
        validateExcelStructure(jsonData)
        
        // Armazenar todos os dados
        setFullData(jsonData)
        
        // Mostrar primeira página do preview
        setPreview(jsonData.slice(0, itemsPerPage))
        setCurrentPage(1)
      }
      
      reader.readAsBinaryString(uploadedFile)
    } catch (error) {
      alert(`Erro ao processar arquivo: ${error.message}`)
      setFile(null)
    }
  }

  // Upload de PDF individual
  const handlePdfUpload = (certificateNumber, file) => {
    if (!file) return
    
    // Verificar se é PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione apenas arquivos PDF')
      return
    }

    // Armazenar arquivo PDF associado ao número do certificado
    setPdfFiles(prev => ({
      ...prev,
      [certificateNumber]: file
    }))
  }

  // Remover PDF selecionado
  const removePdf = (certificateNumber) => {
    setPdfFiles(prev => {
      const updated = { ...prev }
      delete updated[certificateNumber]
      return updated
    })
  }

  // Processar importação em lote
  const processBulkImport = async () => {
    if (!file) return

    setIsProcessing(true)
    setResults(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Upload de PDFs para o Storage primeiro
        const pdfUrls = {}
        for (const [certificateNumber, pdfFile] of Object.entries(pdfFiles)) {
          try {
            const fileName = `${certificateNumber}-${Date.now()}.pdf`
            const { data, error } = await supabase.storage
              .from('certificates')
              .upload(fileName, pdfFile)

            if (error) {
              console.error(`Erro ao fazer upload do PDF ${certificateNumber}:`, error)
            } else {
              // Obter URL pública
              const { data: { publicUrl } } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName)
              
              pdfUrls[certificateNumber] = publicUrl
            }
          } catch (uploadError) {
            console.error(`Erro ao processar PDF ${certificateNumber}:`, uploadError)
          }
        }

        // Validar e processar dados
        const processedData = jsonData.map((row, index) => {
          // Formatar CPF (remover caracteres especiais)
          const cpf = row.cpf?.toString().replace(/[^\d]/g, '')
          
          // Validar CPF
          if (!cpf || cpf.length !== 11) {
            throw new Error(`Linha ${index + 2}: CPF inválido - ${row.cpf}`)
          }

          // Validar e processar data de conclusão
          let dataConlusao
          
          // Função auxiliar para converter data do Excel (número serial) para Date
          const excelDateToJS = (serial) => {
            const utc_days = Math.floor(serial - 25569)
            const utc_value = utc_days * 86400
            const date_info = new Date(utc_value * 1000)
            
            const fractional_day = serial - Math.floor(serial) + 0.0000001
            let total_seconds = Math.floor(86400 * fractional_day)
            
            const seconds = total_seconds % 60
            total_seconds -= seconds
            const hours = Math.floor(total_seconds / (60 * 60))
            const minutes = Math.floor(total_seconds / 60) % 60
            
            return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds)
          }
          
          // Processar diferentes formatos de data
          if (typeof row.data_conclusao === 'number') {
            // Número serial do Excel
            try {
              const date = excelDateToJS(row.data_conclusao)
              dataConlusao = date.toISOString().split('T')[0]
            } catch (err) {
              throw new Error(`Linha ${index + 2}: Data de conclusão inválida (formato numérico) - ${row.data_conclusao}`)
            }
          } else if (row.data_conclusao instanceof Date) {
            dataConlusao = row.data_conclusao.toISOString().split('T')[0]
          } else if (typeof row.data_conclusao === 'string') {
            // Verificar se é formato brasileiro DD/MM/YYYY
            const brazilianDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
            const match = row.data_conclusao.match(brazilianDatePattern)
            
            if (match) {
              // Converter DD/MM/YYYY para YYYY-MM-DD
              const [_, day, month, year] = match
              dataConlusao = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            } else {
              // Tentar outros formatos
              const date = new Date(row.data_conclusao)
              if (isNaN(date.getTime())) {
                throw new Error(`Linha ${index + 2}: Data de conclusão inválida - ${row.data_conclusao}`)
              }
              dataConlusao = date.toISOString().split('T')[0]
            }
          } else {
            throw new Error(`Linha ${index + 2}: Data de conclusão é obrigatória`)
          }

          const certificateNumber = row.numero_certificado?.toString().trim()
          
          return {
            id: `LEGACY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nome_aluno: row.nome_aluno?.toString().trim(),
            cpf: cpf,
            numero_certificado: certificateNumber,
            nome_curso: row.nome_curso?.toString().trim(),
            carga_horaria: parseInt(row.carga_horaria) || 0,
            data_conclusao: dataConlusao,
            pdf_url: pdfUrls[certificateNumber] || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })

        // Enviar para API
        const response = await fetch('/api/admin/bulk-import-certificates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ certificates: processedData })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao importar certificados')
        }

        setResults({
          success: true,
          imported: result.imported,
          errors: result.errors || [],
          total: processedData.length
        })
        
        // Limpar formulários após sucesso
        if (result.imported > 0) {
          setFile(null)
          setPreview(null)
          setFullData(null)
          setCurrentPage(1)
          setPdfFiles({})
          // Reset file input
          const fileInput = document.querySelector('input[type="file"]')
          if (fileInput) {
            fileInput.value = ''
          }
        }
      }
      
      reader.readAsBinaryString(file)
    } catch (error) {
      setResults({
        success: false,
        error: error.message,
        imported: 0,
        total: 0
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Download template Excel
  const downloadTemplate = () => {
    const templateData = [
      {
        nome_aluno: 'João Silva Santos',
        cpf: '12345678900',
        numero_certificado: 'HIST-2023-001',
        nome_curso: 'Curso de Capacitação Profissional',
        carga_horaria: 40,
        data_conclusao: '15/06/2023'
      },
      {
        nome_aluno: 'Maria Oliveira Costa',
        cpf: '98765432100', 
        numero_certificado: 'HIST-2023-002',
        nome_curso: 'Técnico em Administração',
        carga_horaria: 800,
        data_conclusao: '20/12/2023'
      },
      {
        nome_aluno: 'Pedro Souza Lima',
        cpf: '11122233344',
        numero_certificado: 'HIST-2024-003', 
        nome_curso: 'Licenciatura em Pedagogia',
        carga_horaria: 3200,
        data_conclusao: '30/01/2024'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificados')
    XLSX.writeFile(workbook, 'template-certificados-historicos.xlsx')
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Importação em Lote de Certificados Históricos
        </h2>
      </div>

      {/* Download Template */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">
          Primeiro, baixe o template Excel
        </h3>
        <p className="text-blue-700 text-sm mb-3">
          Use o template para garantir que seus dados estejam no formato correto. 
          Este sistema é para certificados históricos independentes (não vinculados a usuários do sistema).
        </p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar Template Excel
        </button>
      </div>

      {/* Estrutura Requerida */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">
          Colunas Obrigatórias no Excel:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          <div><strong>nome_aluno:</strong> Nome completo do aluno</div>
          <div><strong>cpf:</strong> CPF apenas números (11 dígitos)</div>
          <div><strong>numero_certificado:</strong> Número único do certificado</div>
          <div><strong>nome_curso:</strong> Nome do curso completo</div>
          <div><strong>carga_horaria:</strong> Carga horária em horas (número)</div>
          <div><strong>data_conclusao:</strong> Data (DD/MM/YYYY ou YYYY-MM-DD)</div>
        </div>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Importante:</strong> Certificados históricos são registros independentes para consulta pública. 
            Após a importação, você pode adicionar PDFs individuais durante o preview.
          </p>
          <p className="text-sm text-yellow-800 mt-2">
            <strong>Dica:</strong> O sistema aceita datas no formato brasileiro (DD/MM/YYYY) e também 
            detecta automaticamente quando o Excel converte datas para números.
          </p>
        </div>
      </div>

      {/* Upload de Arquivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Arquivo Excel (.xlsx, .xls, .csv)
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Preview dos Dados */}
      {preview && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">
              Preview ({fullData ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, fullData.length)} de ${fullData.length}` : ''} registros):
            </h3>
            {fullData && fullData.length > itemsPerPage && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1)
                    setCurrentPage(newPage)
                    setPreview(fullData.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage))
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {currentPage} de {Math.ceil(fullData.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => {
                    const newPage = Math.min(Math.ceil(fullData.length / itemsPerPage), currentPage + 1)
                    setCurrentPage(newPage)
                    setPreview(fullData.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage))
                  }}
                  disabled={currentPage === Math.ceil(fullData.length / itemsPerPage)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left border-b">Nome Aluno</th>
                  <th className="px-3 py-2 text-left border-b">CPF</th>
                  <th className="px-3 py-2 text-left border-b">Certificado</th>
                  <th className="px-3 py-2 text-left border-b">Curso</th>
                  <th className="px-3 py-2 text-left border-b">CH</th>
                  <th className="px-3 py-2 text-left border-b">Data</th>
                  <th className="px-3 py-2 text-left border-b">PDF</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2">{row.nome_aluno}</td>
                    <td className="px-3 py-2">{row.cpf}</td>
                    <td className="px-3 py-2">{row.numero_certificado}</td>
                    <td className="px-3 py-2">{row.nome_curso}</td>
                    <td className="px-3 py-2">{row.carga_horaria}</td>
                    <td className="px-3 py-2">{row.data_conclusao}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {pdfFiles[row.numero_certificado] ? (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600">PDF anexado</span>
                            <button
                              onClick={() => removePdf(row.numero_certificado)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Remover PDF"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handlePdfUpload(row.numero_certificado, e.target.files[0])}
                              className="hidden"
                            />
                            <span className="text-xs text-blue-600 hover:text-blue-700 underline">
                              Anexar PDF
                            </span>
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botão de Importação */}
      {file && (
        <div className="mb-6">
          <button
            onClick={processBulkImport}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importar Certificados Históricos
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultados */}
      {results && (
        <div className={`p-4 rounded-lg border ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {results.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className={`font-medium ${results.success ? 'text-green-900' : 'text-red-900'}`}>
              {results.success ? 'Importação Concluída' : 'Erro na Importação'}
            </h3>
          </div>
          
          {results.success ? (
            <div className="text-green-700">
              <p>✅ {results.imported} certificados históricos importados com sucesso</p>
              <p>📊 Total processado: {results.total} registros</p>
              {results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-orange-600">⚠️ {results.errors.length} registros com problemas:</p>
                  <ul className="list-disc ml-4 text-sm">
                    {results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-700">{results.error}</p>
          )}
        </div>
      )}
    </Card>
  )
}