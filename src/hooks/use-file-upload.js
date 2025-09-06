'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const uploadFile = async (file, bucket, path = '', options = {}) => {
    try {
      // Verificar se já está fazendo upload
      if (uploading) {
        console.log('Upload já em andamento, ignorando nova solicitação')
        return
      }
      
      setUploading(true)
      setProgress(0)
      setError(null)

      const {
        maxSize = 5 * 1024 * 1024, // 5MB padrão
        allowedTypes = [],
        generateUniqueName = true
      } = options

      // Validações
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`)
      }

      // Gerar nome do arquivo
      let fileName = file.name
      if (generateUniqueName) {
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split('.').pop()
        fileName = `${timestamp}_${randomString}.${fileExtension}`
      }

      // Construir caminho completo
      const fullPath = path ? `${path}/${fileName}` : fileName

      // Simular progresso (Supabase não fornece progresso real)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 100)

      // Upload do arquivo
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      setProgress(100)

      // Obter URL pública se o bucket for público
      let publicUrl = null
      const publicBuckets = ['avatars', 'course-thumbnails', 'public-assets']
      if (publicBuckets.includes(bucket)) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fullPath)
        publicUrl = urlData.publicUrl
      }

      return {
        path: fullPath,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        success: true
      }
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setUploading(false)
      setTimeout(() => {
        setProgress(0)
        setError(null)
      }, 3000)
    }
  }

  const uploadMultiple = async (files, bucket, path = '', options = {}) => {
    const results = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFile(files[i], bucket, path, options)
        results.push(result)
      } catch (error) {
        errors.push({
          file: files[i].name,
          error: error.message
        })
      }
    }

    return { results, errors }
  }

  const deleteFile = async (bucket, path) => {
    try {
      setError(null)
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        throw new Error(`Erro ao deletar arquivo: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const getFileUrl = async (bucket, path, expiresIn = 3600) => {
    try {
      setError(null)

      // Para buckets públicos, retornar URL pública
      const publicBuckets = ['avatars', 'course-thumbnails', 'public-assets']
      if (publicBuckets.includes(bucket)) {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(path)
        return data.publicUrl
      }

      // Para buckets privados, gerar URL assinada
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        throw new Error(`Erro ao gerar URL: ${error.message}`)
      }

      return data.signedUrl
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadMultiple,
    deleteFile,
    getFileUrl
  }
}

// Hook específico para upload de avatares
export function useAvatarUpload() {
  const { uploadFile, deleteFile, error, uploading } = useFileUpload()

  const uploadAvatar = async (file, userId) => {
    const options = {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }

    const result = await uploadFile(file, 'avatars', userId, options)

    // Atualizar perfil do usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: result.publicUrl })
      .eq('id', userId)

    if (updateError) {
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)
    }

    return result
  }

  const removeAvatar = async (userId, currentAvatarUrl) => {
    // Remover URL do perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (updateError) {
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)
    }

    // Tentar remover arquivo do storage
    if (currentAvatarUrl && currentAvatarUrl.includes('/avatars/')) {
      try {
        const filePath = currentAvatarUrl.split('/avatars/')[1]
        await deleteFile('avatars', filePath)
      } catch (error) {
        console.warn('Não foi possível remover arquivo do storage:', error)
      }
    }

    return { success: true }
  }

  return {
    uploadAvatar,
    removeAvatar,
    uploading,
    error
  }
}

// Hook específico para upload de thumbnails de curso
export function useCourseUpload() {
  const { uploadFile, deleteFile, error, uploading } = useFileUpload()

  const uploadThumbnail = async (file, courseId) => {
    const options = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }

    return await uploadFile(file, 'public-assets', `thumbnails/${courseId}`, options)
  }

  const uploadCourseFile = async (file, courseId) => {
    const options = {
      maxSize: 2 * 1024 * 1024 * 1024, // 2GB
      allowedTypes: ['video/mp4', 'video/quicktime', 'application/pdf', 'application/zip']
    }

    return await uploadFile(file, 'public-assets', `videos/${courseId}`, options)
  }

  return {
    uploadThumbnail,
    uploadCourseFile,
    deleteFile,
    uploading,
    error
  }
}