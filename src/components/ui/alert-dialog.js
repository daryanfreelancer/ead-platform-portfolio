import * as React from 'react'
import { cn } from '@/lib/utils'

const AlertDialog = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
AlertDialog.displayName = 'AlertDialog'

const AlertDialogTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <button ref={ref} className={cn('', className)} {...props} />
))
AlertDialogTrigger.displayName = 'AlertDialogTrigger'

const AlertDialogContent = React.forwardRef(({ className, open, onOpenChange, children, ...props }, ref) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      
      {/* Dialog */}
      <div
        ref={ref}
        className={cn(
          'relative z-50 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
})
AlertDialogContent.displayName = 'AlertDialogContent'

const AlertDialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pb-4', className)} {...props} />
))
AlertDialogHeader.displayName = 'AlertDialogHeader'

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold text-gray-900', className)} {...props} />
))
AlertDialogTitle.displayName = 'AlertDialogTitle'

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-gray-600 mt-2', className)} {...props} />
))
AlertDialogDescription.displayName = 'AlertDialogDescription'

const AlertDialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex justify-end gap-3 p-6 pt-4', className)} {...props} />
))
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2',
      className
    )}
    {...props}
  />
))
AlertDialogAction.displayName = 'AlertDialogAction'

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 h-10 px-4 py-2',
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = 'AlertDialogCancel'

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}