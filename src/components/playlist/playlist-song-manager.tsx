'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Check, X } from 'lucide-react'
import { SongList } from './song-list'
import { DraggableSongList } from './draggable-song-list'
import { PlaylistSong } from '@/types/playlist'
import { toast } from '@/lib/hooks/use-toast'

interface PlaylistSongManagerProps {
  songs: PlaylistSong[]
  onPlay?: (song: PlaylistSong) => void
  onRemove?: (song: PlaylistSong) => void
  onReorder?: (songIds: string[]) => Promise<void>
  currentlyPlaying?: string
  showPosition?: boolean
  showPreviewButtons?: boolean
}

export function PlaylistSongManager({
  songs,
  onPlay,
  onRemove,
  onReorder,
  currentlyPlaying,
  showPosition = true,
  showPreviewButtons = true,
}: PlaylistSongManagerProps) {
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const handleReorderToggle = () => {
    setIsReorderMode(!isReorderMode)
  }

  const handleReorder = useCallback(async (songIds: string[]) => {
    if (!onReorder) return

    setIsReordering(true)
    try {
      await onReorder(songIds)
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
      description: 'You can now play songs and access other features',
    })
  }

  if (songs.length === 0) {
    return (
      <SongList
        songs={songs}
        onPlay={onPlay}
        onRemove={onRemove}
        currentlyPlaying={currentlyPlaying}
        showPosition={showPosition}
        showPreviewButtons={showPreviewButtons}
      />
    )
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
                Drag songs to reorder
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
              disabled={songs.length < 2}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Reorder Songs
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

      {/* Song List */}
      {isReorderMode ? (
        <DraggableSongList
          songs={songs}
          onPlay={onPlay}
          onRemove={onRemove}
          onReorder={handleReorder}
          currentlyPlaying={currentlyPlaying}
          showPosition={showPosition}
          showPreviewButtons={showPreviewButtons}
          isReordering={isReordering}
        />
      ) : (
        <SongList
          songs={songs}
          onPlay={onPlay}
          onRemove={onRemove}
          currentlyPlaying={currentlyPlaying}
          showPosition={showPosition}
          showPreviewButtons={showPreviewButtons}
        />
      )}
    </div>
  )
}