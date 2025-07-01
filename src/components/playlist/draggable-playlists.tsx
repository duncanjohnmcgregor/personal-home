'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChevronDown, 
  ChevronRight, 
  Music, 
  GripVertical,
  Trash2,
  Edit,
  Clock,
  Zap
} from 'lucide-react'
import { Playlist, PlaylistSong } from '@/types/playlist'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/hooks/use-toast'

interface DraggablePlaylistsProps {
  playlists: Playlist[]
  onSongMove: (songId: string, fromPlaylistId: string, toPlaylistId: string, newIndex: number) => Promise<void>
  onSongReorder: (playlistId: string, songIds: string[]) => Promise<void>
  onSongRemove: (playlistId: string, songId: string) => Promise<void>
  onPlaylistEdit?: (playlist: Playlist) => void
  onPlaylistDelete?: (playlist: Playlist) => void
}

export function DraggablePlaylists({
  playlists,
  onSongMove,
  onSongReorder,
  onSongRemove,
  onPlaylistEdit,
  onPlaylistDelete,
}: DraggablePlaylistsProps) {
  const containersRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<any>(null)
  const droppableRef = useRef<any>(null)
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!containersRef.current || typeof window === 'undefined') return

    // Dynamically import Shopify Draggable
    import('@shopify/draggable').then(({ Sortable, Droppable }) => {
      if (!containersRef.current) return

      // Initialize Sortable for songs within playlists
      sortableRef.current = new Sortable(
        containersRef.current.querySelectorAll('.playlist-songs'),
        {
          draggable: '.song-item',
          handle: '.song-handle',
          mirror: {
            constrainDimensions: true,
          },
          delay: 100,
        }
      )

      // Initialize Droppable for moving songs between playlists
      droppableRef.current = new Droppable(
        containersRef.current.querySelectorAll('.playlist-songs'),
        {
          draggable: '.song-item',
          dropzone: '.playlist-songs',
        }
      )

      // Event listeners
      sortableRef.current.on('drag:start', () => setIsDragging(true))
      sortableRef.current.on('drag:stop', () => setIsDragging(false))

      sortableRef.current.on('sortable:stop', async (event: any) => {
        const songElement = event.data.dragEvent.source as HTMLElement
        const playlistId = songElement.closest('.playlist-songs')?.getAttribute('data-playlist-id')
        
        if (!playlistId) return

        // Get all song IDs in the new order
        const songElements = songElement.closest('.playlist-songs')?.querySelectorAll('.song-item')
        const songIds = Array.from(songElements || []).map((el: Element) => el.getAttribute('data-song-id')).filter(Boolean) as string[]

        try {
          await onSongReorder(playlistId, songIds)
        } catch (error) {
          // Revert on error - Draggable will handle this
          event.cancel()
        }
      })

      droppableRef.current.on('droppable:dropped', async (event: any) => {
        const droppedElement = event.data.dropzone as HTMLElement
        const draggedElement = event.data.dragEvent.source as HTMLElement
        
        const fromPlaylistId = draggedElement.closest('.playlist-songs')?.getAttribute('data-playlist-id')
        const toPlaylistId = droppedElement.getAttribute('data-playlist-id')
        const songId = draggedElement.getAttribute('data-song-id')
        
        if (!fromPlaylistId || !toPlaylistId || !songId || fromPlaylistId === toPlaylistId) {
          return
        }

        const newIndex = Array.from(droppedElement.querySelectorAll('.song-item')).indexOf(draggedElement)

        try {
          await onSongMove(songId, fromPlaylistId, toPlaylistId, newIndex)
          toast({
            title: 'Success',
            description: 'Song moved successfully',
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
      sortableRef.current?.destroy()
      droppableRef.current?.destroy()
    }
  }, [playlists, onSongMove, onSongReorder])

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
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleRemoveSong = async (playlistId: string, songId: string) => {
    try {
      await onSongRemove(playlistId, songId)
      toast({
        title: 'Success',
        description: 'Song removed from playlist',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove song',
        variant: 'destructive',
      })
    }
  }

  return (
    <div ref={containersRef} className="space-y-4">
      {playlists.map((playlist) => {
        const isExpanded = expandedPlaylists.has(playlist.id)
        
        return (
          <Card key={playlist.id} className="overflow-hidden">
            <CardHeader className="cursor-pointer" onClick={() => togglePlaylist(playlist.id)}>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    {playlist.name}
                  </CardTitle>
                  <Badge variant="secondary">{playlist._count.songs} songs</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {onPlaylistEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPlaylistEdit(playlist)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onPlaylistDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPlaylistDelete(playlist)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {playlist.description && (
                <p className="text-sm text-muted-foreground mt-2">{playlist.description}</p>
              )}
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div
                    className="playlist-songs p-4 min-h-[100px]"
                    data-playlist-id={playlist.id}
                  >
                    {playlist.songs && playlist.songs.length > 0 ? (
                      playlist.songs.map((playlistSong, index) => (
                        <div
                          key={playlistSong.id}
                          className={cn(
                            "song-item flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors",
                            isDragging && "cursor-grabbing",
                            !isDragging && "cursor-grab"
                          )}
                          data-song-id={playlistSong.song.id}
                          data-playlist-song-id={playlistSong.id}
                        >
                          <div className="song-handle">
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
                            {playlistSong.song.bpm && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {playlistSong.song.bpm}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(playlistSong.song.duration)}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSong(playlist.id, playlistSong.song.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No songs in this playlist</p>
                        <p className="text-sm">Drag songs here to add them</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}