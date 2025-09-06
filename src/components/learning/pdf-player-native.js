'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize,
  Minimize,
  FileText,
  Loader2,
  AlertCircle,
  Home,
  Search,
  Printer
} from 'lucide-react'

const supabase = createClient()

export function PDFPlayerNative({ lesson, enrollment, onProgressUpdate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [readingProgress, setReadingProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastReadPosition, setLastReadPosition] = useState(null)
  
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const progressUpdateRef = useRef(null)

  useEffect(() => {
    loadPDF()
    loadReadingProgress()
  }, [lesson.id])

  useEffect(() => {
    // Update progress when page changes
    if (totalPages && currentPage) {
      const progress = Math.round((currentPage / totalPages) * 100)
      setReadingProgress(progress)
      
      // Debounce progress updates
      clearTimeout(progressUpdateRef.current)
      progressUpdateRef.current = setTimeout(() => {
        updateReadingProgress(progress, currentPage)
      }, 1000)
    }
  }, [currentPage, totalPages])

  const loadPDF = async () => {
    try {
      if (!lesson.pdf_file_url) {
        setError('PDF não encontrado')
        return
      }

      const { data } = supabase.storage
        .from('public-assets')
        .getPublicUrl(lesson.pdf_file_url)
      
      // Fix CORS issue by using relative URL for same-origin requests
      const relativePdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(data.publicUrl)}`
      const viewerUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(relativePdfUrl)}`
      setPdfUrl(viewerUrl)
      setLoading(false)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setError('Erro ao carregar PDF')
      setLoading(false)
    }
  }

  const loadReadingProgress = async () => {
    try {
      const response = await fetch(`/api/lesson-progress?lesson_id=${lesson.id}`)
      if (response.ok) {
        const progressData = await response.json()
        if (progressData && typeof progressData === 'object') {
          if (Array.isArray(progressData) && progressData.length > 0) {
            const progress = progressData[0]
            setReadingProgress(progress.reading_progress_percentage || 0)
            if (progress.last_read_position) {
              const page = parseInt(progress.last_read_position)
              setCurrentPage(page || 1)
              setLastReadPosition(page)
            }
          } else if (!Array.isArray(progressData) && progressData.reading_progress_percentage !== undefined) {
            setReadingProgress(progressData.reading_progress_percentage || 0)
            if (progressData.last_read_position) {
              const page = parseInt(progressData.last_read_position)
              setCurrentPage(page || 1)
              setLastReadPosition(page)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading reading progress:', error)
    }
  }

  const updateReadingProgress = async (progressPercentage, page) => {
    try {
      const response = await fetch('/api/lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          progress_percentage: progressPercentage,
          reading_progress_percentage: progressPercentage,
          last_read_position: page.toString()
        })
      })

      if (response.ok) {
        onProgressUpdate?.(progressPercentage)
      }
    } catch (error) {
      console.error('Error updating reading progress:', error)
    }
  }

  const handleIframeLoad = () => {
    setLoading(false)
    
    // Listen for PDF.js events to track pages
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.addEventListener('message', (event) => {
          if (event.data.type === 'pagechange') {
            setCurrentPage(event.data.page)
          }
          if (event.data.type === 'documentloaded') {
            setTotalPages(event.data.numPages)
          }
        })
      } catch (e) {
        // Cross-origin restrictions may prevent this
        console.log('Unable to listen to PDF.js events due to CORS')
      }
    }
  }

  const toggleFullscreen = () => {
    const element = containerRef.current
    if (!element) return

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    if (pdfUrl) {
      // Extract original PDF URL from viewer URL
      const urlParams = new URLSearchParams(pdfUrl.split('?')[1])
      const originalUrl = urlParams.get('file')
      if (originalUrl) {
        const link = document.createElement('a')
        link.href = originalUrl
        link.download = `${lesson.title}.pdf`
        link.click()
      }
    }
  }

  const navigatePage = (direction) => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      try {
        if (direction === 'next') {
          iframe.contentWindow.PDFViewerApplication.page++
        } else {
          iframe.contentWindow.PDFViewerApplication.page--
        }
      } catch (e) {
        console.log('Unable to control PDF.js navigation due to CORS')
      }
    }
  }

  const zoomControl = (action) => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      try {
        const viewer = iframe.contentWindow.PDFViewerApplication
        if (action === 'in') {
          viewer.zoomIn()
        } else if (action === 'out') {
          viewer.zoomOut()
        } else if (action === 'reset') {
          viewer.pdfViewer.currentScaleValue = 'page-width'
        }
      } catch (e) {
        console.log('Unable to control PDF.js zoom due to CORS')
      }
    }
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar PDF</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-100 rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full'
      }`}
    >
      {/* Header with Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-col gap-4 max-w-full overflow-hidden">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900 truncate">{lesson.title}</h3>
            </div>
            
            {/* Progress Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
              <span className="whitespace-nowrap">{readingProgress}% lido</span>
              
              {/* Mark as Complete Button */}
              {readingProgress >= 90 && readingProgress < 100 && (
                <button
                  onClick={() => updateReadingProgress(100, currentPage)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors min-h-[44px] whitespace-nowrap"
                >
                  Marcar como concluída
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center justify-center max-w-full overflow-hidden">
            {/* Navigation Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigatePage('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="text-sm text-gray-600 px-2 min-h-[44px] flex items-center whitespace-nowrap">
                {currentPage && totalPages ? `${currentPage} de ${totalPages}` : 'Carregando...'}
              </div>
              
              <button
                onClick={() => navigatePage('next')}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => zoomControl('out')}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => zoomControl('reset')}
                className="p-2 rounded-lg hover:bg-gray-100 text-xs min-h-[44px] whitespace-nowrap"
                title="Ajustar à largura"
              >
                Ajustar
              </button>
              
              <button
                onClick={() => zoomControl('in')}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            
            {/* Additional Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Baixar PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={`${isFullscreen ? 'h-screen' : 'h-96'} relative`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Carregando PDF...</p>
            </div>
          </div>
        )}
        
        {pdfUrl && (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full border-0"
            title={lesson.title}
            onLoad={handleIframeLoad}
            sandbox="allow-scripts allow-popups allow-forms allow-downloads"
            style={{ 
              display: loading ? 'none' : 'block',
              background: '#525659'
            }}
          />
        )}
      </div>
    </div>
  )
}