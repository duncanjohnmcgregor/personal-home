'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChevronDown, 
  ChevronRight, 
  Folder,
  FolderOpen,
  Music,
  GripVertical,
  Clock
} from 'lucide-react'
import { Playlist } from '@/types/playlist'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/hooks/use-toast'

interface SimpleDraggablePlaylistsProps {
  playlists: Playlist[]
  onSongMove: (songId: string, fromPlaylistId: string, toPlaylistId: string) => Promise<void>
}

export function SimpleDraggablePlaylists({
  playlists,
  onSongMove,
}: SimpleDraggablePlaylistsProps) {
  const containersRef = useRef<HTMLDivElement>(null)
  const droppableRef = useRef<any>(null)
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [draggedSong, setDraggedSong] = useState<string | null>(null)

  useEffect(() => {
    if (!containersRef.current || typeof window === 'undefined') return

    // Dynamically import Shopify Draggable
    import('@shopify/draggable').then(({ Droppable }) => {
      if (!containersRef.current) return

      // Initialize Droppable for moving songs between playlists
      droppableRef.current = new Droppable(containersRef.current, {
        draggable: '.song-item',
        dropzone: '.playlist-dropzone',
        delay: 100,
      })

      // Event listeners
      droppableRef.current.on('drag:start', (event: any) => {
        setIsDragging(true)
        const songId = event.source.getAttribute('data-song-id')
        setDraggedSong(songId)
      })

      droppableRef.current.on('drag:stop', () => {
        setIsDragging(false)
        setDraggedSong(null)
      })

      droppableRef.current.on('droppable:dropped', async (event: any) => {
        const droppedElement = event.data.dropzone as HTMLElement
        const draggedElement = event.data.dragEvent.source as HTMLElement
        
        const fromPlaylistId = draggedElement.getAttribute('data-playlist-id')
        const toPlaylistId = droppedElement.getAttribute('data-playlist-id')
        const songId = draggedElement.getAttribute('data-song-id')
        
        if (!fromPlaylistId || !toPlaylistId || !songId || fromPlaylistId === toPlaylistId) {
          return
        }

        try {
          await onSongMove(songId, fromPlaylistId, toPlaylistId)
          toast({
            title: 'Song moved',
            description: 'Song successfully moved to the new playlist',
          })
        } catch (error) {
          event.cancel()
          toast({
            title: 'Error',
            description: 'Failed to move song',
            variant: 'destructive',
          })
        }
      })
    })

    // Cleanup
    return () => {
      droppableRef.current?.destroy()
    }
  }, [playlists, onSongMove])

  const togglePlaylist = (playlistId: string) => {
    const newExpanded = new Set(expandedPlaylists)
    if (newExpanded.has(playlistId)) {
      newExpanded.delete(playlistId)
    } else {
      newExpanded.add(playlistId)
    }
    setExpandedPlaylists(newExpanded)
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '--'
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    const secondsStr = seconds < 10 ? `0${seconds}` : seconds.toString()
    return `${minutes}:${secondsStr}`
  }

  return (
    <div ref={containersRef} className="space-y-4">
      {playlists.map((playlist) => {
        const isExpanded = expandedPlaylists.has(playlist.id)
        const isDropTarget = isDragging && draggedSong
        
        return (
          <Card 
            key={playlist.id} 
            className={cn(
              "overflow-hidden transition-all duration-200",
              isDropTarget && "ring-2 ring-blue-500 ring-opacity-50"
            )}
          >
            {/* Playlist Header - Always a drop target */}
            <CardHeader 
              className={cn(
                "cursor-pointer playlist-dropzone transition-colors",
                isDropTarget && "bg-blue-50 border-blue-200"
              )}
              data-playlist-id={playlist.id}
              onClick={() => togglePlaylist(playlist.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePlaylist(playlist.id)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Folder className="h-5 w-5 text-gray-600" />
                    )}
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    {playlist._count.songs} songs
                  </Badge>
                </div>
                
                {isDropTarget && (
                  <div className="text-sm text-blue-600 font-medium">
                    Drop here to move
                  </div>
                )}
              </div>
              
              {playlist.description && (
                <p className="text-sm text-muted-foreground mt-2">{playlist.description}</p>
              )}
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="p-4 space-y-2">
                    {playlist.songs && playlist.songs.length > 0 ? (
                      playlist.songs.map((playlistSong, index) => (
                        <div
                          key={playlistSong.id}
                          className={cn(
                            "song-item flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent",
                            isDragging && "cursor-grabbing",
                            !isDragging && "cursor-grab"
                          )}
                          data-song-id={playlistSong.song.id}
                          data-playlist-id={playlist.id}
                        >
                          <div className="drag-handle">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="w-8 text-sm text-muted-foreground text-center">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {playlistSong.song.title}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {playlistSong.song.artist}
                              {playlistSong.song.album && ` • ${playlistSong.song.album}`}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(playlistSong.song.duration)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>This playlist is empty</p>
                        <p className="text-sm">Drag songs from other playlists to add them here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        )
      })}
      
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Drag to a playlist to move this song
          </div>
        </div>
      )}
    </div>
  )
}