'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, Image, Video, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/button'
import { cn } from '@/lib/utils'

const supabase = createClient()

export function FileUpload({
  bucket = 'avatars',
  path = '',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB padrão
  onUpload,
  onError,
  className,
  children,
  multiple = false,
  disabled = false
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file) => {
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSize)}`)
    }

    // Validar tipos de arquivo baseado no bucket
    const allowedTypes = {
      'avatars': ['image/jpeg', 'image/png', 'image/webp'],
      'course-thumbnails': ['image/jpeg', 'image/png', 'image/webp'],
      'course-materials': [
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
      ],
      'course-files': ['video/mp4', 'video/quicktime', 'application/pdf', 'application/zip'],
      'certificates': ['application/pdf', 'image/jpeg', 'image/png'],
      'public-assets': [
        // Imagens
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        // Vídeos
        'video/mp4', 'video/quicktime', 'video/avi', 'video/webm',
        // Documentos
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
      ]
    }

    if (allowedTypes[bucket] && !allowedTypes[bucket].includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes[bucket].join(', ')}`)
    }

    return true
  }

  const uploadFile = async (file) => {
    try {
      setUploading(true)
      setUploadProgress(5) // Iniciar com 5% para feedback visual imediato

      console.log('=== INICIANDO UPLOAD ===', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        path,
        uploadingState: uploading
      })

      // Validar arquivo
      validateFile(file)

      // Remover verificação de bucket - desnecessária e pode causar problemas

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${fileExtension}`
      
      // Construir caminho completo
      const fullPath = path ? `${path}/${fileName}` : fileName

      console.log('Caminho completo do upload:', fullPath)

      // Simulador de progresso
      let progressStarted = false
      const progressInterval = setInterval(() => {
        if (!progressStarted) {
          progressStarted = true
          console.log('Progresso simulado iniciado')
        }
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          const increment = Math.min(Math.random() * 15 + 5, 90 - prev)
          const newProgress = Math.min(prev + increment, 90)
          console.log(`Progresso: ${prev}% -> ${newProgress}%`)
          return newProgress
        })
      }, 300)

      // Adicionar timeout para evitar travamento
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          clearInterval(progressInterval)
      console.log('Progresso simulado parado')
          reject(new Error('Upload timeout após 60 segundos'))
        }, 60000)
      })

      // Upload do arquivo com timeout
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise])
      
      clearInterval(progressInterval)
      console.log('Progresso simulado parado')

      if (error) {
        console.error('Erro detalhado do Supabase:', error)
        throw new Error(`Erro no upload: ${error.message}`)
      }

      console.log('=== UPLOAD CONCLUÍDO ===', data)

      // Obter URL pública se o bucket for público
      let publicUrl = null
      if (bucket === 'avatars' || bucket === 'course-thumbnails' || bucket === 'course-materials' || bucket === 'public-assets') {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fullPath)
        publicUrl = urlData.publicUrl
        console.log('URL pública gerada:', publicUrl ? 'URL disponível' : 'Erro na URL')
      }

      // Callback de sucesso
      if (onUpload) {
        console.log('=== CHAMANDO CALLBACK onUpload ===', {
          path: fullPath ? 'Path disponível' : 'Erro no path',
          publicUrl: publicUrl ? 'URL disponível' : 'Erro na URL',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          bucket
        })
        onUpload({
          path: fullPath,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          bucket
        })
      }

      setUploadProgress(100)
      console.log('Progresso definido para 100%')
      
      return { path: fullPath, publicUrl }
    } catch (error) {
      console.error('Erro no upload:', error)
      console.error('Stack trace:', error.stack)
      if (onError) {
        onError(error.message)
      }
      throw error
    } finally {
      console.log('=== UPLOAD FINALIZADO - setUploading(false) ===')
      setUploading(false)
      setTimeout(() => {
        console.log('Resetando progresso para 0%')
        setUploadProgress(0)
      }, 3000) // Aumentar para 3 segundos
    }
  }

  const handleFileSelect = async (files) => {
    if (uploading) {
      console.log('Upload já em andamento, ignorando seleção de arquivo')
      return
    }
    
    const fileArray = Array.from(files)
    
    if (!multiple && fileArray.length > 1) {
      if (onError) {
        onError('Apenas um arquivo é permitido')
      }
      return
    }

    for (const file of fileArray) {
      try {
        await uploadFile(file)
      } catch (error) {
        // Erro já tratado no uploadFile
        break
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled || uploading) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileSelect(files)
      // Limpar o input para permitir re-upload do mesmo arquivo
      e.target.value = ''
    }
  }

  const openFileDialog = () => {
    if (disabled || uploading) {
      console.log('Upload dialog bloqueado:', { disabled, uploading })
      return
    }
    console.log('Abrindo dialog de arquivo')
    fileInputRef.current?.click()
  }

  if (children) {
    return (
      <div className={cn("relative", className)}>
        <div
          onClick={openFileDialog}
          className={cn(
            "cursor-pointer",
            disabled || uploading ? "cursor-not-allowed opacity-50" : ""
          )}
        >
          {children}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          multiple={multiple}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Enviando... {uploadProgress}%</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          disabled || uploading ? "cursor-not-allowed opacity-50" : "",
          uploading ? "bg-gray-50" : ""
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          multiple={multiple}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Enviando arquivo...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragOver ? 'Solte o arquivo aqui' : 'Clique para enviar ou arraste e solte'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tamanho máximo: {formatFileSize(maxSize)}
              </p>
              {multiple && (
                <p className="text-xs text-gray-500 mt-1">
                  Você pode selecionar múltiplos arquivos
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}