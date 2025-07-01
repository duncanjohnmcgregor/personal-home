'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Pause, Plus, Edit, Share, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
// Removed PlaylistSongManager - now using draggable playlists on main page
import { PlaylistForm } from '@/components/playlist/playlist-form'
import { AddSongsDialog } from '@/components/search/add-songs-dialog'
import { BPMAutoAnalyzer, BPMStatus } from '@/components/bpm'
import { usePlaylist } from '@/lib/hooks/use-playlists'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { Playlist, UpdatePlaylistData, PlaylistSong, RemoveSongFromPlaylistData } from '@/types/playlist'
import { toast } from '@/lib/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const { playlist, loading, error, fetchPlaylist } = usePlaylist()
  const { updatePlaylist, deletePlaylist, removeSongFromPlaylist } = usePlaylists()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddSongs, setShowAddSongs] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  // Fetch playlist on mount
  useEffect(() => {
    if (playlistId) {
      fetchPlaylist(playlistId)
    }
  }, [playlistId, fetchPlaylist])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
      }
    }
  }, [currentAudio])

  const handlePlay = (playlistSong: PlaylistSong) => {
    const song = playlistSong.song
    
    // If no preview URL available, show a message
    if (!song.previewUrl) {
      toast({
        title: 'No preview available',
        description: 'This track does not have a preview available.',
        variant: 'destructive',
      })
      return
    }

    // If clicking the same song
    if (currentSong === song.id && currentAudio) {
      if (isPlaying) {
        currentAudio.pause()
        setIsPlaying(false)
      } else {
        currentAudio.play()
          .then(() => setIsPlaying(true))
          .catch((error: any) => {
            console.error('Error playing audio:', error)
            toast({
              title: 'Playback error',
              description: 'Unable to play the audio preview.',
              variant: 'destructive',
            })
          })
      }
      return
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
    }

    // Create new audio element
    const audio = new Audio(song.previewUrl)
    audio.volume = 0.7
    
    audio.onended = () => {
      setIsPlaying(false)
      setCurrentSong(null)
      setCurrentAudio(null)
    }
    
    audio.onerror = () => {
      setIsPlaying(false)
      setCurrentSong(null)
      setCurrentAudio(null)
      toast({
        title: 'Playback error',
        description: 'Unable to load the audio preview.',
        variant: 'destructive',
      })
    }

    // Play the audio
    audio.play()
      .then(() => {
        setCurrentAudio(audio)
        setCurrentSong(song.id)
        setIsPlaying(true)
      })
      .catch((error: any) => {
        console.error('Error playing audio:', error)
        toast({
          title: 'Playback error',
          description: 'Unable to play the audio preview.',
          variant: 'destructive',
        })
      })
  }

  const handleRemoveSong = async (playlistSong: PlaylistSong) => {
    if (!playlist) return

    const data: RemoveSongFromPlaylistData = {
      songId: playlistSong.song.id,
    }

    try {
      const success = await removeSongFromPlaylist(playlist.id, data)
      if (success) {
        toast({
          title: 'Success',
          description: 'Song removed from playlist',
        })
        // Refresh playlist
        fetchPlaylist(playlist.id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove song from playlist',
        variant: 'destructive',
      })
    }
  }



  const handleUpdatePlaylist = async (data: UpdatePlaylistData) => {
    if (!playlist) return

    setIsUpdating(true)
    try {
      const result = await updatePlaylist(playlist.id, data)
      if (result) {
        toast({
          title: 'Success',
          description: 'Playlist updated successfully',
        })
        setShowEditForm(false)
        // Refresh playlist
        fetchPlaylist(playlist.id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update playlist',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePlaylist = async () => {
    if (!playlist) return

    if (!confirm(`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const success = await deletePlaylist(playlist.id)
      if (success) {
        toast({
          title: 'Success',
          description: 'Playlist deleted successfully',
        })
        router.push('/dashboard/playlists')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete playlist',
        variant: 'destructive',
      })
    }
  }

  const formatDuration = (totalDuration: number) => {
    const hours = Math.floor(totalDuration / 3600000)
    const minutes = Math.floor((totalDuration % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const totalDuration = playlist?.songs.reduce((acc, playlistSong) => {
    return acc + (playlistSong.song.duration || 0)
  }, 0) || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchPlaylist(playlistId)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Playlist not found</h2>
        <p className="text-muted-foreground mb-4">
          The playlist you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push('/dashboard/playlists')}>
          Back to Playlists
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Playlist Info */}
      <div className="flex flex-col md:flex-row gap-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <div className="w-48 h-48 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
          {playlist.image ? (
            <img
              src={playlist.image}
              alt={playlist.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-muted-foreground/20 rounded" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2 truncate">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-muted-foreground mb-4">
                  {playlist.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit playlist
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share playlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeletePlaylist}
                  className="text-destructive focus:text-destructive"
                >
                  Delete playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Badge variant={playlist.isPublic ? "default" : "secondary"}>
              {playlist.isPublic ? 'Public' : 'Private'}
            </Badge>
            {playlist.spotifyId && (
              <Badge variant="outline" className="text-green-600">
                Spotify
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
            <span>{playlist._count.songs} songs</span>
            {totalDuration > 0 && <span>{formatDuration(totalDuration)}</span>}
            <span>
              Updated {formatDistanceToNow(new Date(playlist.updatedAt), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              disabled={playlist.songs.length === 0}
              onClick={() => {
                if (playlist.songs.length > 0) {
                  handlePlay(playlist.songs[0])
                }
              }}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button variant="outline" onClick={() => setShowAddSongs(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Songs
            </Button>
          </div>
        </div>
      </div>

      {/* BPM Analysis */}
      <BPMAutoAnalyzer 
        songs={playlist.songs.map(ps => ps.song)} 
        priority="normal"
      />

      {/* BPM Status */}
      <BPMStatus compact className="mb-4" />

      {/* Songs List */}
      <div className="bg-card rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Songs</h2>
          {playlist.songs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No songs in this playlist yet.</p>
              <p className="text-sm">Click &quot;Add Songs&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlist.songs.map((playlistSong, index) => (
                <div
                  key={playlistSong.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 text-sm text-muted-foreground text-center">
                    {index + 1}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => handlePlay(playlistSong)}
                  >
                    {currentSong === playlistSong.song.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
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
                      <Badge variant="outline" className="text-xs">
                        {playlistSong.song.bpm} BPM
                      </Badge>
                    )}
                    
                    {playlistSong.song.duration && (
                      <span>
                        {Math.floor(playlistSong.song.duration / 60000)}:
                        {((playlistSong.song.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}
                      </span>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemoveSong(playlistSong)}
                          className="text-destructive focus:text-destructive"
                        >
                          Remove from playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t text-sm text-muted-foreground">
          <p>
            To reorder songs or move them between playlists, visit the{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => router.push('/dashboard/playlists')}
            >
              Playlist Manager
            </Button>
          </p>
        </div>
      </div>

      {/* Edit Form Dialog */}
      <PlaylistForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        playlist={playlist}
        onSubmit={handleUpdatePlaylist}
        isSubmitting={isUpdating}
      />

      {/* Add Songs Dialog */}
      <AddSongsDialog
        open={showAddSongs}
        onOpenChange={setShowAddSongs}
        playlistId={playlist.id}
        playlistName={playlist.name}
        onSongAdded={() => fetchPlaylist(playlist.id)}
      />
    </div>
  )
}