'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { PlaylistCard } from './playlist-card'
import { Playlist } from '@/types/playlist'
import { cn } from '@/lib/utils'

interface DraggablePlaylistCardProps {
  playlist: Playlist
  onEdit?: (playlist: Playlist) => void
  onDelete?: (playlist: Playlist) => void
  isDragging?: boolean
  isReordering?: boolean
  viewMode?: 'grid' | 'list'
}

export function DraggablePlaylistCard({
  playlist,
  onEdit,
  onDelete,
  isDragging,
  isReordering = false,
  viewMode = 'grid',
}: DraggablePlaylistCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: playlist.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isCurrentlyDragging = isDragging || isSortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group drag-chrome-fix',
        isCurrentlyDragging && 'z-50 opacity-50',
        isReordering && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Drag Handle - Only visible in reorder mode */}
      {isReordering && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute top-2 left-2 z-10 p-1 rounded bg-background/80 backdrop-blur-sm border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity drag-handle-chrome-fix',
            viewMode === 'list' && 'top-1/2 -translate-y-1/2'
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      {/* Playlist Card */}
      <div className={cn(isReordering && 'pointer-events-none')}>
        <PlaylistCard
          playlist={playlist}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}