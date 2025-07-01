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
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { DraggableSongItem } from './draggable-song-item'
import { PlaylistSong } from '@/types/playlist'
import { EmptyState } from '@/components/ui/empty-state'
import { Music } from 'lucide-react'

interface DraggableSongListProps {
  songs: PlaylistSong[]
  onPlay?: (song: PlaylistSong) => void
  onRemove?: (song: PlaylistSong) => void
  onReorder?: (songIds: string[]) => Promise<void>
  currentlyPlaying?: string
  showPosition?: boolean
  showPreviewButtons?: boolean
  isReordering?: boolean
}

export function DraggableSongList({
  songs,
  onPlay,
  onRemove,
  onReorder,
  currentlyPlaying,
  showPosition = true,
  showPreviewButtons = true,
  isReordering = false,
}: DraggableSongListProps) {
  const [items, setItems] = useState(() => 
    [...songs].sort((a, b) => a.position - b.position)
  )
  const [isDragging, setIsDragging] = useState(false)

  // Update items when songs prop changes
  useEffect(() => {
    const sortedSongs = [...songs].sort((a, b) => a.position - b.position)
    setItems(sortedSongs)
  }, [songs])

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

    // Call onReorder with the new order of song IDs
    if (onReorder) {
      try {
        await onReorder(newItems.map(item => item.songId))
      } catch (error) {
        // Revert on error
        setItems(items)
        console.error('Failed to reorder songs:', error)
      }
    }
  }, [items, onReorder])

  if (songs.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No songs in this playlist"
        description="Add some songs to get started"
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {items.map((playlistSong, index) => (
            <DraggableSongItem
              key={playlistSong.id}
              playlistSong={playlistSong}
              position={index + 1}
              isPlaying={currentlyPlaying === playlistSong.song.id}
              onPlay={onPlay}
              onRemove={onRemove}
              showPosition={showPosition}
              showPreviewButton={showPreviewButtons}
              isDragging={isDragging}
              isReordering={isReordering}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}