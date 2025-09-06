import { cn } from '@/lib/utils'

const Input = ({ className, type = 'text', error, ...props }) => {
  return (
    <div className="space-y-1">
      <input
        type={type}
        className={cn(
          "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-500 min-h-[44px]",
          error ? "border-red-500" : "border-gray-300",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Input
