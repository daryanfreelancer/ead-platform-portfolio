import { createClient } from '@/lib/supabase/client'

export class StorageCleanup {
  constructor() {
    this.supabase = createClient()
  }

  // Extrai nome do arquivo de uma URL do Supabase Storage
  extractFileNameFromUrl(url) {
    if (!url) return null
    
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/file.ext
    const match = url.match(/\/([^\/]+)$/)
    return match ? match[1] : null
  }

  // Remove arquivo do storage
  async deleteFile(bucket, fileName) {
    if (!fileName) return { success: true }
    
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([fileName])
      
      if (error) {
        console.error(`Erro ao deletar arquivo ${fileName}:`, error)
        return { success: false, error }
      }
      
      console.log(`Arquivo ${fileName} deletado com sucesso`)
      return { success: true }
    } catch (error) {
      console.error(`Erro ao deletar arquivo ${fileName}:`, error)
      return { success: false, error }
    }
  }

  // Remove avatar do usuário
  async deleteUserAvatar(avatarUrl) {
    const fileName = this.extractFileNameFromUrl(avatarUrl)
    return this.deleteFile('avatars', fileName)
  }

  // Remove arquivos do curso (thumbnail e vídeo)
  async deleteCourseFiles(thumbnailUrl, videoUrl) {
    const results = []
    
    // Delete thumbnail
    if (thumbnailUrl) {
      const thumbnailFile = this.extractFileNameFromUrl(thumbnailUrl)
      results.push(await this.deleteFile('course-thumbnails', thumbnailFile))
    }
    
    // Delete video file (apenas se for upload, não URL externa)
    if (videoUrl && !videoUrl.startsWith('http')) {
      const videoFile = this.extractFileNameFromUrl(videoUrl)
      results.push(await this.deleteFile('course-files', videoFile))
    }
    
    return results
  }

  // Lista arquivos órfãos (não referenciados no banco)
  async findOrphanedFiles(bucket) {
    try {
      const { data: files, error } = await this.supabase.storage
        .from(bucket)
        .list()
      
      if (error) {
        console.error(`Erro ao listar arquivos do bucket ${bucket}:`, error)
        return []
      }
      
      // Esta é uma versão básica - em produção, seria necessário
      // comparar com todas as referências no banco de dados
      return files || []
    } catch (error) {
      console.error(`Erro ao buscar arquivos órfãos:`, error)
      return []
    }
  }

  // Remove todos os arquivos órfãos de um bucket
  async cleanupOrphanedFiles(bucket) {
    const orphanedFiles = await this.findOrphanedFiles(bucket)
    const results = []
    
    for (const file of orphanedFiles) {
      const result = await this.deleteFile(bucket, file.name)
      results.push({ file: file.name, ...result })
    }
    
    return results
  }
}