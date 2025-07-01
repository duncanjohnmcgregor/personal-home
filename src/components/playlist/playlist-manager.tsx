'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Check, X } from 'lucide-react'
import { PlaylistCard } from './playlist-card'
import { DraggablePlaylistList } from './draggable-playlist-list'
import { Playlist } from '@/types/playlist'
import { toast } from '@/lib/hooks/use-toast'
import { Tabs, TabsContent } from '@/components/ui/tabs'

interface PlaylistManagerProps {
  playlists: Playlist[]
  viewMode: 'grid' | 'list'
  onEdit?: (playlist: Playlist) => void
  onDelete?: (playlist: Playlist) => void
  onReorder?: (playlistIds: string[]) => Promise<void>
}

export function PlaylistManager({
  playlists,
  viewMode,
  onEdit,
  onDelete,
  onReorder,
}: PlaylistManagerProps) {
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const handleReorderToggle = () => {
    setIsReorderMode(!isReorderMode)
  }

  const handleReorder = useCallback(async (playlistIds: string[]) => {
    if (!onReorder) return

    setIsReordering(true)
    try {
      await onReorder(playlistIds)
      toast({
        title: 'Success',
        description: 'Playlist order updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update playlist order',
        variant: 'destructive',
      })
      throw error // Re-throw to let the draggable list handle reverting
    } finally {
      setIsReordering(false)
    }
  }, [onReorder])

  const handleCancelReorder = () => {
    setIsReorderMode(false)
  }

  const handleFinishReorder = () => {
    setIsReorderMode(false)
    toast({
      title: 'Reorder mode disabled',
      description: 'You can now access playlist actions and other features',
    })
  }

  if (playlists.length === 0) {
    return null // Let the parent handle empty state
  }

  return (
    <div className="space-y-4">
      {/* Reorder Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isReorderMode ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpDown className="h-4 w-4" />
                Drag playlists to reorder
              </div>
              {isReordering && (
                <div className="text-sm text-muted-foreground">
                  Updating...
                </div>
              )}
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReorderToggle}
              disabled={playlists.length < 2}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Reorder Playlists
            </Button>
          )}
        </div>

        {isReorderMode && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelReorder}
              disabled={isReordering}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleFinishReorder}
              disabled={isReordering}
            >
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </div>

      {/* Playlist List */}
      <Tabs value={viewMode} className="space-y-4">
        <TabsContent value="grid" className="space-y-0">
          {isReorderMode ? (
            <DraggablePlaylistList
              playlists={playlists}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={handleReorder}
              isReordering={isReordering}
              viewMode="grid"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="space-y-0">
          {isReorderMode ? (
            <DraggablePlaylistList
              playlists={playlists}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={handleReorder}
              isReordering={isReordering}
              viewMode="list"
            />
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}