import { cn } from '@/lib/utils'

const Card = ({ children, className, ...props }) => (
  <div 
    className={cn("bg-white rounded-lg shadow-md border border-gray-200", className)}
    {...props}
  >
    {children}
  </div>
)

const CardHeader = ({ children, className, ...props }) => (
  <div className={cn("p-6 pb-4", className)} {...props}>
    {children}
  </div>
)

const CardContent = ({ children, className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
)

const CardFooter = ({ children, className, ...props }) => (
  <div className={cn("p-6 pt-4 border-t border-gray-100", className)} {...props}>
    {children}
  </div>
)

export { Card, CardHeader, CardContent, CardFooter }
