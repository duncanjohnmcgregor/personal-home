'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableCategoryProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function DroppableCategory({ id, children, className }: DroppableCategoryProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors duration-200',
        isOver && 'bg-accent/50 border-accent-foreground/20 border-2 border-dashed rounded-lg',
        className
      )}
    >
      {children}
    </div>
  )
}