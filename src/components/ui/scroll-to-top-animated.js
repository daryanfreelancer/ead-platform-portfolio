'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ScrollToTopAnimated({ theme = 'blue' }) {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calcula o progresso do scroll
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (winScroll / height) * 100
      
      setScrollProgress(scrolled)
      
      // Mostra após rolar uma página completa
      const viewportHeight = window.innerHeight
      setIsVisible(window.scrollY > viewportHeight)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const themeColors = {
    blue: {
      bg: 'from-blue-600 to-blue-700',
      hover: 'hover:from-blue-700 hover:to-blue-800',
      ring: 'focus:ring-blue-500/50',
      progress: 'bg-blue-400'
    },
    green: {
      bg: 'from-green-600 to-green-700',
      hover: 'hover:from-green-700 hover:to-green-800',
      ring: 'focus:ring-green-500/50',
      progress: 'bg-green-400'
    },
    purple: {
      bg: 'from-purple-600 to-purple-700',
      hover: 'hover:from-purple-700 hover:to-purple-800',
      ring: 'focus:ring-purple-500/50',
      progress: 'bg-purple-400'
    }
  }

  const colors = themeColors[theme] || themeColors.blue

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-16 pointer-events-none"
      )}
    >
      {/* Indicador de progresso circular */}
      <div className="relative">
        <svg
          className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 -rotate-90"
          viewBox="0 0 56 56"
        >
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-300/30"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - scrollProgress / 100)}`}
            className={cn("transition-all duration-300", colors.progress)}
          />
        </svg>
        
        {/* Botão */}
        <button
          onClick={scrollToTop}
          className={cn(
            "relative",
            "bg-gradient-to-r",
            colors.bg,
            colors.hover,
            "text-white rounded-full",
            "w-14 h-14 sm:w-16 sm:h-16",
            "shadow-lg hover:shadow-2xl",
            "transition-all duration-300",
            "hover:scale-110 active:scale-95",
            "focus:outline-none focus:ring-4",
            colors.ring,
            "flex items-center justify-center",
            "group",
            "backdrop-blur-sm"
          )}
          aria-label="Voltar ao topo"
          title={`Voltar ao topo (${Math.round(scrollProgress)}% da página)`}
        >
          <ArrowUp 
            className={cn(
              "w-6 h-6 sm:w-7 sm:h-7",
              "transition-transform duration-300",
              "group-hover:translate-y-[-3px]"
            )} 
          />
          
          {/* Efeito de ondulação */}
          <span 
            className="absolute inset-0 rounded-full animate-ping bg-white/20"
            style={{ animationDuration: '2s' }}
          />
        </button>
      </div>
      
      {/* Badge de porcentagem */}
      <div 
        className={cn(
          "absolute -top-2 -left-2",
          "bg-gray-900 text-white",
          "text-xs font-bold",
          "w-10 h-10 rounded-full",
          "flex items-center justify-center",
          "shadow-md",
          "transition-transform duration-300",
          scrollProgress > 90 ? "scale-110" : "scale-100"
        )}
      >
        {Math.round(scrollProgress)}%
      </div>
    </div>
  )
}