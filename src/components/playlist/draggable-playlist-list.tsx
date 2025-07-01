'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import { DraggablePlaylistCard } from './draggable-playlist-card'
import { Playlist } from '@/types/playlist'
import { EmptyState } from '@/components/ui/empty-state'
import { Music } from 'lucide-react'

interface DraggablePlaylistListProps {
  playlists: Playlist[]
  onEdit?: (playlist: Playlist) => void
  onDelete?: (playlist: Playlist) => void
  onReorder?: (playlistIds: string[]) => Promise<void>
  isReordering?: boolean
  viewMode?: 'grid' | 'list'
}

export function DraggablePlaylistList({
  playlists,
  onEdit,
  onDelete,
  onReorder,
  isReordering = false,
  viewMode = 'grid',
}: DraggablePlaylistListProps) {
  const [items, setItems] = useState(() => [...playlists])
  const [isDragging, setIsDragging] = useState(false)

  // Update items when playlists prop changes
  useEffect(() => {
    setItems([...playlists])
  }, [playlists])

  // Enhanced sensor configuration for better Chrome compatibility
  const sensors = useSensors(
    // Mouse sensor with different activation constraint for Chrome
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8 to 5 for better Chrome response
      },
    }),
    // Touch sensor as fallback for touch devices and Chrome touch emulation
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    // Pointer sensor with adjusted settings for Chrome
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8 to 5 for better Chrome response
      },
    }),
    // Keyboard sensor for accessibility
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setIsDragging(false)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    // Call onReorder with the new order of playlist IDs
    if (onReorder) {
      try {
        await onReorder(newItems.map(item => item.id))
      } catch (error) {
        // Revert on error
        setItems(items)
        console.error('Failed to reorder playlists:', error)
      }
    }
  }, [items, onReorder])

  if (playlists.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No playlists yet"
        description="Create your first playlist to get started"
      />
    )
  }

  const sortingStrategy = viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy
  const modifiers = viewMode === 'grid' 
    ? [restrictToWindowEdges] 
    : [restrictToVerticalAxis, restrictToWindowEdges]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      <SortableContext items={items.map(item => item.id)} strategy={sortingStrategy}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((playlist) => (
              <DraggablePlaylistCard
                key={playlist.id}
                playlist={playlist}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragging={isDragging}
                isReordering={isReordering}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((playlist) => (
              <DraggablePlaylistCard
                key={playlist.id}
                playlist={playlist}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragging={isDragging}
                isReordering={isReordering}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  )
}