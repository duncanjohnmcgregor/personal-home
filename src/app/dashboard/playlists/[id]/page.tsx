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
import { PlaylistSongManager } from '@/components/playlist/playlist-song-manager'
import { PlaylistForm } from '@/components/playlist/playlist-form'
import { AddSongsDialog } from '@/components/search/add-songs-dialog'
import { usePlaylist } from '@/lib/hooks/use-playlists'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { Playlist, UpdatePlaylistData, PlaylistSong, RemoveSongFromPlaylistData, ReorderPlaylistSongsData } from '@/types/playlist'
import { toast } from '@/lib/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const { playlist, loading, error, fetchPlaylist } = usePlaylist()
  const { updatePlaylist, deletePlaylist, removeSongFromPlaylist, reorderPlaylistSongs } = usePlaylists()

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

  const handleReorderSongs = async (songIds: string[]) => {
    if (!playlist) return

    const data: ReorderPlaylistSongsData = {
      songIds,
    }

    try {
      const updatedPlaylist = await reorderPlaylistSongs(playlist.id, data)
      if (updatedPlaylist) {
        // The playlist state is updated by the hook automatically
        // We can optionally refresh to ensure consistency
        fetchPlaylist(playlist.id)
      }
    } catch (error) {
      throw error // Re-throw to let the component handle the error
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

      {/* Songs List */}
      <div className="bg-card rounded-lg p-6">
        <PlaylistSongManager
          songs={playlist.songs}
          onPlay={handlePlay}
          onRemove={handleRemoveSong}
          onReorder={handleReorderSongs}
          currentlyPlaying={currentSong || undefined}
        />
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