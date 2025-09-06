'use client'

import { useState, useEffect, useRef } from 'react'

// Componente de animação de contagem
export default function CountUpNumber({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          animateCount()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  const animateCount = () => {
    const startTime = Date.now()
    const endValue = parseInt(end.toString().replace(/\D/g, '')) || 100

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const currentCount = Math.floor(easeOutExpo * endValue)
      
      setCount(currentCount)
      
      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }
    
    requestAnimationFrame(updateCount)
  }

  return (
    <div ref={ref} className="text-3xl font-bold mb-2">
      {count}{suffix}
    </div>
  )
}