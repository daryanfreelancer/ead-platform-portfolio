'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from './file-upload'
import { Camera, X } from 'lucide-react'
import Button from './button'
import { cn } from '@/lib/utils'

const supabase = createClient()

export function AvatarUpload({
  currentAvatarUrl,
  userId,
  onAvatarUpdate,
  onError,
  size = 'lg',
  className
}) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [isRemoving, setIsRemoving] = useState(false)

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  }

  const handleUpload = async (uploadResult) => {
    try {
      // Atualizar URL do avatar na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadResult.publicUrl })
        .eq('id', userId)

      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`)
      }

      setAvatarUrl(uploadResult.publicUrl)
      
      if (onAvatarUpdate) {
        onAvatarUpdate(uploadResult.publicUrl)
      }
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error)
      if (onError) {
        onError(error.message)
      }
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setIsRemoving(true)

      // Remover URL do avatar da tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) {
        throw new Error(`Erro ao remover avatar: ${error.message}`)
      }

      // Se tinha um avatar anterior, tentar remover do storage
      if (avatarUrl && avatarUrl.includes('/avatars/')) {
        const filePath = avatarUrl.split('/avatars/')[1]
        await supabase.storage
          .from('avatars')
          .remove([`${userId}/${filePath}`])
      }

      setAvatarUrl(null)
      
      if (onAvatarUpdate) {
        onAvatarUpdate(null)
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      if (onError) {
        onError(error.message)
      }
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn("relative rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg", sizes[size])}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar do usuário"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl font-bold">
            <Camera className="w-8 h-8" />
          </div>
        )}
        
        {/* Overlay para upload */}
        <FileUpload
          bucket="avatars"
          path={userId}
          accept="image/*"
          maxSize={5 * 1024 * 1024} // 5MB
          onUpload={handleUpload}
          onError={onError}
          className="absolute inset-0"
        >
          <div className="w-full h-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </FileUpload>
      </div>

      {/* Botão de remover avatar */}
      {avatarUrl && (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleRemoveAvatar}
          disabled={isRemoving}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
        >
          {isRemoving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  )
}