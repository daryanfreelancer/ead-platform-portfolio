import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const Select = React.forwardRef(({ 
  value, 
  onValueChange, 
  children,
  className,
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState(null)
  
  const handleValueChange = (newValue, item) => {
    onValueChange?.(newValue)
    setSelectedItem(item)
    setIsOpen(false)
  }
  
  return (
    <div className={cn('relative', className)} ref={ref} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            value,
            selectedItem,
            onValueChange: handleValueChange
          })
        }
        return child
      })}
    </div>
  )
})
Select.displayName = 'Select'

const SelectTrigger = React.forwardRef(({ 
  className, 
  children, 
  isOpen, 
  setIsOpen,
  value,
  selectedItem,
  ...props 
}, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    onClick={() => setIsOpen?.(!isOpen)}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectValue) {
        return React.cloneElement(child, { value, selectedItem })
      }
      return child
    })}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
))
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = React.forwardRef(({ 
  placeholder, 
  className, 
  value,
  selectedItem, 
  children,
  ...props 
}, ref) => {
  return (
    <span
      ref={ref}
      className={cn('block truncate', className)}
      {...props}
    >
      {selectedItem ? selectedItem : (value ? value : placeholder)}
    </span>
  )
})
SelectValue.displayName = 'SelectValue'

const SelectContent = React.forwardRef(({ 
  className, 
  children, 
  isOpen, 
  setIsOpen, 
  value, 
  onValueChange, 
  ...props 
}, ref) => {
  if (!isOpen) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onValueChange,
            currentValue: value,
            setIsOpen
          })
        }
        return child
      })}
    </div>
  )
})
SelectContent.displayName = 'SelectContent'

const SelectItem = React.forwardRef(({ 
  className, 
  children, 
  value, 
  onValueChange, 
  currentValue, 
  setIsOpen, 
  ...props 
}, ref) => {
  const isSelected = value === currentValue
  
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'relative w-full cursor-default select-none py-2 pl-3 pr-9 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        isSelected && 'bg-blue-50 text-blue-600',
        className
      )}
      onClick={() => {
        onValueChange?.(value, children)
        setIsOpen?.(false)
      }}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </button>
  )
})
SelectItem.displayName = 'SelectItem'

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}