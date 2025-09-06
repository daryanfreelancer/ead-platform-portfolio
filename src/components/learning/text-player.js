'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Type, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  BookOpen,
  Clock,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'

export function TextPlayer({ lesson, enrollment, onProgressUpdate }) {
  const [fontSize, setFontSize] = useState(16)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [isReaderMode, setIsReaderMode] = useState(false)
  const [lastScrollPosition, setLastScrollPosition] = useState(0)
  
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const progressUpdateRef = useRef(null)
  const readingTimeRef = useRef(0)

  useEffect(() => {
    loadReadingProgress()
    calculateEstimatedTime()
    
    // Start reading timer
    const interval = setInterval(() => {
      readingTimeRef.current += 1
      setReadingTime(readingTimeRef.current)
    }, 1000)

    return () => clearInterval(interval)
  }, [lesson.id])

  useEffect(() => {
    const handleScroll = () => {
      updateScrollProgress()
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const loadReadingProgress = async () => {
    try {
      const response = await fetch(`/api/lesson-progress?lesson_id=${lesson.id}`)
      if (response.ok) {
        const progressData = await response.json()
        if (progressData.length > 0) {
          const progress = progressData[0]
          setReadingProgress(progress.reading_progress_percentage || 0)
          if (progress.last_read_position) {
            const scrollPos = parseInt(progress.last_read_position)
            setLastScrollPosition(scrollPos)
            
            // Restore scroll position after component mounts
            setTimeout(() => {
              const container = containerRef.current
              if (container) {
                container.scrollTop = scrollPos
              }
            }, 100)
          }
        }
      }
    } catch (error) {
      console.error('Error loading reading progress:', error)
    }
  }

  const calculateEstimatedTime = () => {
    // Calculate estimated reading time (average 200 words per minute)
    const text = lesson.text_content || ''
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const estimatedMinutes = Math.ceil(wordCount / 200)
    setEstimatedTime(estimatedMinutes)
  }

  const updateScrollProgress = () => {
    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
    const clampedProgress = Math.max(0, Math.min(100, progress))
    
    setReadingProgress(clampedProgress)
    setLastScrollPosition(scrollTop)

    // Debounce progress updates
    clearTimeout(progressUpdateRef.current)
    progressUpdateRef.current = setTimeout(() => {
      updateReadingProgress(clampedProgress, scrollTop)
    }, 1000)
  }

  const updateReadingProgress = async (progressPercentage, scrollPosition) => {
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
          last_read_position: scrollPosition.toString(),
          watch_time_seconds: readingTimeRef.current
        })
      })

      if (response.ok) {
        onProgressUpdate?.(progressPercentage)
      }
    } catch (error) {
      console.error('Error updating reading progress:', error)
    }
  }

  const handleZoomIn = () => {
    setFontSize(size => Math.min(24, size + 2))
  }

  const handleZoomOut = () => {
    setFontSize(size => Math.max(12, size - 2))
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

  const toggleReaderMode = () => {
    setIsReaderMode(!isReaderMode)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'text-green-600'
    if (progress >= 75) return 'text-blue-600'
    if (progress >= 50) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-white rounded-lg overflow-hidden max-w-full ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full'
      } ${isReaderMode ? 'bg-amber-50' : ''}`}
    >
      {/* Header with Controls */}
      <div className={`border-b border-gray-200 p-4 ${isReaderMode ? 'bg-amber-50' : 'bg-white'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 truncate">{lesson.title}</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {/* Reading Stats */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(readingTime)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>~{estimatedTime} min</span>
              </div>
              
              <div className={`flex items-center gap-1 ${getProgressColor(readingProgress)}`}>
                <CheckCircle className="w-4 h-4" />
                <span>{readingProgress}% lido</span>
              </div>
              
            </div>
            
            {/* Controls and Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Font Size Controls */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-md hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Diminuir fonte"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center px-2">
                    {fontSize}px
                  </span>
                  
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-md hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Aumentar fonte"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Additional Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleReaderMode}
                    className={`p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      isReaderMode ? 'bg-amber-100 text-amber-700' : ''
                    }`}
                    title={isReaderMode ? 'Sair do modo leitura' : 'Modo leitura'}
                  >
                    {isReaderMode ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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
              
              {/* Action Button */}
              {readingProgress >= 90 && readingProgress < 100 && (
                <button
                  onClick={() => updateReadingProgress(100, lastScrollPosition)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[44px] whitespace-nowrap flex-shrink-0"
                >
                  Marcar como concluída
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className={`overflow-auto ${isFullscreen ? 'h-screen' : 'h-96'}`}>
        <div 
          ref={contentRef}
          className={`p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto ${isReaderMode ? 'bg-amber-50' : 'bg-white'} w-full`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={`prose prose-sm sm:prose-lg max-w-full w-full break-words ${
              isReaderMode ? 'prose-amber' : 'prose-gray'
            }`}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-6 text-gray-900">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 text-gray-700">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 text-gray-700">{children}</ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-600 mb-4">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-purple-600">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto mb-4 text-sm max-w-full whitespace-pre-wrap break-words">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4 max-w-full">
                  <table className="w-full border-collapse border border-gray-300">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-4 py-2">{children}</td>
              ),
            }}
          >
            {lesson.text_content || 'Conteúdo não disponível'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}