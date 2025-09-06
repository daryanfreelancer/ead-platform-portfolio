'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UserAvatar({ 
  avatarUrl, 
  userName, 
  size = 'md', 
  className,
  showBorder = true,
  fallbackColor = 'blue'
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  }

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  }

  const colors = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    pink: 'from-pink-400 to-pink-600',
    orange: 'from-orange-400 to-orange-600',
    gray: 'from-gray-400 to-gray-600'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const shouldShowImage = avatarUrl && !imageError

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden flex-shrink-0",
        sizes[size],
        showBorder && "ring-2 ring-white shadow-sm",
        className
      )}
      title={userName || 'Usuário'}
    >
      {shouldShowImage ? (
        <>
          {imageLoading && (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br animate-pulse",
              colors[fallbackColor]
            )} />
          )}
          <img
            src={avatarUrl}
            alt={userName ? `Avatar de ${userName}` : 'Avatar do usuário'}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-200",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      ) : (
        <div className={cn(
          "w-full h-full flex items-center justify-center",
          "bg-gradient-to-br text-white font-semibold",
          colors[fallbackColor]
        )}>
          {userName ? (
            <span className={cn(
              "select-none",
              size === 'xs' ? 'text-xs' :
              size === 'sm' ? 'text-xs' :
              size === 'md' ? 'text-sm' :
              size === 'lg' ? 'text-base' :
              size === 'xl' ? 'text-lg' :
              'text-xl'
            )}>
              {getInitials(userName)}
            </span>
          ) : (
            <User className={iconSizes[size]} />
          )}
        </div>
      )}
    </div>
  )
}

// Componente específico para avatar clicável (ex: menu dropdown)
export function UserAvatarButton({ 
  avatarUrl, 
  userName, 
  size = 'md',
  className,
  onClick,
  ...props 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-transform hover:scale-105",
        className
      )}
      aria-label={`Perfil de ${userName || 'usuário'}`}
      {...props}
    >
      <UserAvatar
        avatarUrl={avatarUrl}
        userName={userName}
        size={size}
        showBorder={true}
      />
    </button>
  )
}