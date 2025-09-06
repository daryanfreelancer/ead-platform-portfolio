import { cn } from '@/lib/utils'

const Label = ({ children, className, required, htmlFor, ...props }) => (
  <label 
    htmlFor={htmlFor}
    className={cn("block text-sm font-medium text-gray-800 mb-1", className)}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
)

export default Label
