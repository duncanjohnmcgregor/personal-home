import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  message: string
  className?: string
  variant?: "default" | "destructive"
}

export function ErrorMessage({ 
  message, 
  className, 
  variant = "destructive" 
}: ErrorMessageProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 rounded-md p-3 text-sm",
        variant === "destructive" 
          ? "bg-destructive/15 text-destructive border border-destructive/20" 
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}