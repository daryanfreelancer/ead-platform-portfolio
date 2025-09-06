'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    let scrollTimeout

    const handleScroll = () => {
      // Pega a altura da viewport
      const viewportHeight = window.innerHeight
      
      // Mostra o botão após rolar uma página completa
      if (window.scrollY > viewportHeight) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }

      // Adiciona classe durante scroll para efeito visual
      setIsScrolling(true)
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll)
    
    // Verifica scroll inicial
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "bg-gradient-to-r from-blue-600 to-blue-700",
        "text-white rounded-full p-3 sm:p-4",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-in-out",
        "hover:scale-110 active:scale-95",
        "focus:outline-none focus:ring-4 focus:ring-blue-500/50",
        "min-w-[48px] min-h-[48px]",
        "flex items-center justify-center",
        "group",
        // Animações de entrada/saída
        isVisible 
          ? "opacity-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 translate-y-16 pointer-events-none",
        // Efeito durante scroll
        isScrolling && "scale-90"
      )}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <ChevronUp 
        className={cn(
          "w-5 h-5 sm:w-6 sm:h-6",
          "transition-transform duration-300",
          "group-hover:translate-y-[-2px]"
        )} 
      />
      
      {/* Efeito de pulso */}
      <span 
        className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        aria-hidden="true"
      />
      
      {/* Tooltip em desktop */}
      <span 
        className={cn(
          "absolute bottom-full right-0 mb-2",
          "bg-gray-900 text-white text-xs rounded-md px-3 py-1.5",
          "whitespace-nowrap",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200",
          "pointer-events-none",
          "hidden sm:block",
          "after:content-[''] after:absolute after:top-full after:right-4",
          "after:border-4 after:border-transparent after:border-t-gray-900"
        )}
      >
        Voltar ao topo
      </span>
    </button>
  )
}