'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Play, Pause, MoreVertical, Trash2, ExternalLink, Volume2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { PlaylistSong } from '@/types/playlist'

interface DraggableSongItemProps {
  playlistSong: PlaylistSong
  position: number
  isPlaying?: boolean
  onPlay?: (song: PlaylistSong) => void
  onRemove?: (song: PlaylistSong) => void
  showPosition?: boolean
  showPreviewButton?: boolean
  isDragging?: boolean
  isReordering?: boolean
}

export function DraggableSongItem({
  playlistSong,
  position,
  isPlaying = false,
  onPlay,
  onRemove,
  showPosition = true,
  showPreviewButton = true,
  isDragging = false,
  isReordering = false,
}: DraggableSongItemProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const { song } = playlistSong

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: playlistSong.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const handleRemove = async () => {
    if (isRemoving || !onRemove) return
    
    setIsRemoving(true)
    try {
      await onRemove(playlistSong)
    } finally {
      setIsRemoving(false)
    }
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleExternalLink = () => {
    if (song.spotifyId) {
      window.open(`https://open.spotify.com/track/${song.spotifyId}`, '_blank')
    }
  }

  const handlePreviewPlay = () => {
    if (!song.previewUrl) return
    
    if (isPreviewPlaying) {
      // Stop the current audio
      const currentAudio = document.querySelector('audio[data-preview-playing="true"]') as HTMLAudioElement
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.remove()
      }
      setIsPreviewPlaying(false)
    } else {
      // Stop any other playing previews
      const existingAudio = document.querySelector('audio[data-preview-playing="true"]') as HTMLAudioElement
      if (existingAudio) {
        existingAudio.pause()
        existingAudio.remove()
      }
      
      // Create and play new audio
      const audio = new Audio(song.previewUrl)
      audio.setAttribute('data-preview-playing', 'true')
      audio.volume = 0.7
      
      audio.onended = () => {
        setIsPreviewPlaying(false)
        audio.remove()
      }
      
      audio.onerror = () => {
        setIsPreviewPlaying(false)
        audio.remove()
        console.error('Error loading audio preview')
      }
      
      audio.play()
        .then(() => setIsPreviewPlaying(true))
        .catch((error: any) => {
          console.error('Error playing preview:', error)
          setIsPreviewPlaying(false)
          audio.remove()
        })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors drag-chrome-fix ${
        isSortableDragging ? 'z-50' : ''
      } ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Drag Handle */}
      {isReordering && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 h-6 flex-shrink-0 text-muted-foreground hover:text-foreground drag-handle-chrome-fix"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Position/Play Button */}
      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
        {showPosition && !isPlaying && !isReordering && (
          <span className="text-sm text-muted-foreground group-hover:hidden">
            {position}
          </span>
        )}
        {showPosition && !isPlaying && isReordering && (
          <span className="text-sm text-muted-foreground">
            {position}
          </span>
        )}
        {onPlay && !isReordering && (
          <Button
            variant="ghost"
            size="sm"
            className={`w-8 h-8 p-0 ${showPosition ? 'hidden group-hover:flex' : 'flex'} ${isPlaying ? 'flex' : ''}`}
            onClick={() => onPlay(playlistSong)}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          {/* Album Art or Placeholder */}
          <div className="w-12 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            {song.image ? (
              <img
                src={song.image}
                alt={`${song.title} cover`}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
            )}
          </div>

          {/* Song Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate mb-1">
              {song.title}
            </h4>
            <p className="text-sm text-muted-foreground truncate">
              {song.artist}
              {song.album && ` • ${song.album}`}
            </p>
          </div>
        </div>
      </div>

      {/* BPM Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {song.bpm && (
          <Badge variant="secondary" className="text-xs">
            {song.bpm} BPM
          </Badge>
        )}
      </div>

      {/* Platform Badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {song.spotifyId && (
          <Badge variant="outline" className="text-green-600 border-green-600/20">
            Spotify
          </Badge>
        )}
        {song.soundcloudId && (
          <Badge variant="outline" className="text-orange-600 border-orange-600/20">
            SoundCloud
          </Badge>
        )}
        {song.beatportId && (
          <Badge variant="outline" className="text-purple-600 border-purple-600/20">
            Beatport
          </Badge>
        )}
      </div>

      {/* Preview Button */}
      {showPreviewButton && song.previewUrl && !isReordering && (
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
            onClick={handlePreviewPlay}
            title={isPreviewPlaying ? 'Stop preview' : 'Play preview'}
          >
            {isPreviewPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Duration */}
      {song.duration && (
        <div className="text-sm text-muted-foreground flex-shrink-0 w-12 text-right">
          {formatDuration(song.duration)}
        </div>
      )}

      {/* Actions Menu */}
      {!isReordering && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {song.spotifyId && (
                <DropdownMenuItem onClick={handleExternalLink}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Spotify
                </DropdownMenuItem>
              )}
              {onRemove && (
                <>
                  {song.spotifyId && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isRemoving ? 'Removing...' : 'Remove from playlist'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}