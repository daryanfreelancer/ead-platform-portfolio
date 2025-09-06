'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LessonProgressButton } from './lesson-progress-button'
import { 
  Type,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Maximize,
  Minimize
} from 'lucide-react'

export function TextPlayerSimple({ lesson, enrollment, onProgressUpdate }) {
  const [fontSize, setFontSize] = useState(16)
  const [isReaderMode, setIsReaderMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  const handleZoomIn = () => {
    setFontSize(size => Math.min(24, size + 2))
  }

  const handleZoomOut = () => {
    setFontSize(size => Math.max(12, size - 2))
  }

  const toggleReaderMode = () => {
    setIsReaderMode(!isReaderMode)
  }

  const toggleFullscreen = () => {
    const element = containerRef.current
    if (!element) return

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-lg overflow-hidden shadow-lg ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Header */}
      <div className={`border-b border-gray-200 p-4 ${isReaderMode ? 'bg-amber-50' : 'bg-white'}`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
            </div>
            
            <LessonProgressButton
              lesson={lesson}
              enrollment={enrollment}
              onProgressUpdate={onProgressUpdate}
            />
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Font Size */}
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
            
            {/* Reader Mode */}
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
            
            {/* Fullscreen */}
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

      {/* Content */}
      <div className={`overflow-auto ${isFullscreen ? 'h-screen' : 'h-[600px]'}`}>
        <div 
          className={`p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto ${isReaderMode ? 'bg-amber-50' : 'bg-white'}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={`prose prose-sm sm:prose-lg max-w-full w-full break-words ${
              isReaderMode ? 'prose-amber' : 'prose-gray'
            }`}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-6 text-gray-900 break-words">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 break-words">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mb-3 text-gray-800 break-words">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-gray-700 break-words">{children}</p>
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
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-purple-600 break-words">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto mb-4 text-sm max-w-full">
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
              img: ({ src, alt }) => (
                <img 
                  src={src} 
                  alt={alt} 
                  className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                />
              )
            }}
          >
            {lesson.text_content || 'Conteúdo não disponível'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}