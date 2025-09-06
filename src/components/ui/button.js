'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  disabled,
  type = 'button',
  onClick,
  ...props 
}) => {
  const [isShaking, setIsShaking] = useState(false)
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700"
  }

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[44px]",
    md: "px-4 py-2 min-h-[44px]",
    lg: "px-6 py-3 text-lg min-h-[44px]"
  }

  const handleClick = (e) => {
    if (disabled) return
    
    // Trigger shake animation
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 300)
    
    // Call original onClick if provided
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button 
      type={type}
      className={cn(
        "font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        isShaking && "animate-click-bounce",
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export { Button }
export default Button
