'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Music, FolderOpen, Folder } from 'lucide-react'
import { Playlist, PlaylistCategory } from '@/types/playlist'
import { DraggablePlaylistCard } from './draggable-playlist-card'
import { DroppableCategory } from './droppable-category'

interface PlaylistOrganizerProps {
  playlists: Playlist[]
  categories: PlaylistCategory[]
  onPlaylistMove: (playlistId: string, newCategoryId?: string) => Promise<void>
  onPlaylistReorder: (playlistIds: string[]) => Promise<void>
  loading?: boolean
}

export function PlaylistOrganizer({
  playlists,
  categories,
  onPlaylistMove,
  onPlaylistReorder,
  loading = false,
}: PlaylistOrganizerProps) {
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Group playlists by category
  const uncategorizedPlaylists = playlists.filter(p => !p.categoryId)
  const categorizedPlaylists = categories.map(category => ({
    category,
    playlists: playlists.filter(p => p.categoryId === category.id),
  }))

  const handleDragStart = (event: DragStartEvent) => {
    setActivePlaylist(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActivePlaylist(null)
    setIsDragging(false)

    if (!over || active.id === over.id) {
      return
    }

    const playlistId = active.id as string
    const targetId = over.id as string

    // Check if dropping on a category
    const targetCategory = categories.find(c => c.id === targetId)
    if (targetCategory) {
      await onPlaylistMove(playlistId, targetCategory.id)
      return
    }

    // Check if dropping on uncategorized area
    if (targetId === 'uncategorized') {
      await onPlaylistMove(playlistId, undefined)
      return
    }

    // Handle reordering within the same category or uncategorized
    const draggedPlaylist = playlists.find(p => p.id === playlistId)
    const targetPlaylist = playlists.find(p => p.id === targetId)

    if (draggedPlaylist && targetPlaylist) {
      // If both playlists are in the same category, reorder them
      if (draggedPlaylist.categoryId === targetPlaylist.categoryId) {
        const categoryPlaylists = playlists.filter(p => p.categoryId === draggedPlaylist.categoryId)
        const oldIndex = categoryPlaylists.findIndex(p => p.id === playlistId)
        const newIndex = categoryPlaylists.findIndex(p => p.id === targetId)
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedPlaylists = arrayMove(categoryPlaylists, oldIndex, newIndex)
          await onPlaylistReorder(reorderedPlaylists.map(p => p.id))
        }
      }
    }
  }, [playlists, categories, onPlaylistMove, onPlaylistReorder])

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!loading && playlists.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No playlists to organize"
        description="Create some playlists first to organize them"
      />
    )
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Uncategorized Playlists */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Uncategorized
              <Badge variant="secondary" className="ml-auto">
                {uncategorizedPlaylists.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DroppableCategory id="uncategorized">
              <ScrollArea className="h-[400px] w-full">
                {uncategorizedPlaylists.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No uncategorized playlists</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-1">
                    {uncategorizedPlaylists.map(playlist => (
                      <DraggablePlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        isDragging={isDragging && activePlaylist === playlist.id}
                        isReordering={false}
                        viewMode="list"
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DroppableCategory>
          </CardContent>
        </Card>

        {/* Categorized Playlists */}
        {categorizedPlaylists.map(({ category, playlists: categoryPlaylists }) => (
          <Card key={category.id} className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" style={{ color: category.color }} />
                {category.name}
                <Badge variant="secondary" className="ml-auto">
                  {categoryPlaylists.length}
                </Badge>
              </CardTitle>
              {category.description && (
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <DroppableCategory id={category.id}>
                <ScrollArea className="h-[400px] w-full">
                  {categoryPlaylists.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No playlists in this category</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 p-1">
                      {categoryPlaylists.map(playlist => (
                        <DraggablePlaylistCard
                          key={playlist.id}
                          playlist={playlist}
                          isDragging={isDragging && activePlaylist === playlist.id}
                          isReordering={false}
                          viewMode="list"
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DroppableCategory>
            </CardContent>
          </Card>
        ))}

        {/* Add Category Placeholder */}
        {categories.length === 0 && (
          <Card className="h-fit border-dashed">
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Create categories to organize your playlists</p>
                <p className="text-xs">Switch to the &quot;Manage Categories&quot; tab</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DndContext>
  )
}