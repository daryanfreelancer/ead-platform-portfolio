'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LessonProgressButton } from './lesson-progress-button'
import { 
  FileText,
  Loader2,
  AlertCircle,
  Download,
  ExternalLink
} from 'lucide-react'

const supabase = createClient()

export function PDFPlayerSimple({ lesson, enrollment, onProgressUpdate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)

  useEffect(() => {
    loadPDF()
  }, [lesson.id])

  const loadPDF = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!lesson.pdf_file_url) {
        setError('PDF não encontrado')
        setLoading(false)
        return
      }

      // Get the public URL for the PDF
      const { data } = supabase.storage
        .from('public-assets')
        .getPublicUrl(lesson.pdf_file_url)
      
      if (data?.publicUrl) {
        setPdfUrl(data.publicUrl)
      } else {
        setError('URL do PDF não disponível')
      }
    } catch (error) {
      console.error('Error loading PDF:', error)
      setError('Erro ao carregar PDF')
    } finally {
      setLoading(false)
    }
  }


  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${lesson.title}.pdf`
      link.target = '_blank'
      link.click()
    }
  }

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Carregando PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar PDF</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <LessonProgressButton
              lesson={lesson}
              enrollment={enrollment}
              onProgressUpdate={onProgressUpdate}
            />
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium min-h-[44px]"
              title="Baixar PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar</span>
            </button>
            
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative h-[600px] bg-gray-100">
        <iframe
          src={`${pdfUrl}#view=FitH&toolbar=0`}
          className="w-full h-full border-0"
          title={lesson.title}
          loading="lazy"
        />
        
        {/* Fallback message */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg pointer-events-auto">
            <p className="text-gray-600 mb-4">
              Problemas para visualizar o PDF?
            </p>
            <button
              onClick={handleOpenNewTab}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Abrir em nova aba
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}