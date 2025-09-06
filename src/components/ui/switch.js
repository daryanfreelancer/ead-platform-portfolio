import { cn } from '@/lib/utils'

export function Switch({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  size = 'default',
  className 
}) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }

  const sizeClasses = {
    sm: 'h-5 w-9',
    default: 'h-6 w-11',
    lg: 'h-7 w-14'
  }

  const thumbSizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    default: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0'
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex-shrink-0',
        sizeClasses[size],
        checked 
          ? 'bg-blue-600' 
          : 'bg-gray-200',
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
          thumbSizeClasses[size],
          translateClasses[size]
        )}
      />
    </button>
  )
}