'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SearchInput } from './search-input'
import { SearchResults } from './search-results'
import { useSearch, SearchTrack } from '@/lib/hooks/use-search'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { toast } from '@/lib/hooks/use-toast'

interface AddSongsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlistId: string
  playlistName: string
  onSongAdded?: () => void
}

export function AddSongsDialog({
  open,
  onOpenChange,
  playlistId,
  playlistName,
  onSongAdded,
}: AddSongsDialogProps) {
  const {
    loading,
    results,
    query,
    platforms,
    totalResults,
    error,
    search,
    clearSearch,
    setPlatforms,
    setQuery,
  } = useSearch()

  const { addSongToPlaylist } = usePlaylists()
  const [addingTracks, setAddingTracks] = useState<Set<string>>(new Set())

  const handleAddToPlaylist = useCallback(async (track: SearchTrack) => {
    setAddingTracks(prev => new Set(prev).add(track.id))

    try {
      // First, create or find the song in our database
      const songData = {
        title: track.name,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        image: track.image,
        previewUrl: track.previewUrl,
        ...(track.platform === 'spotify' && { spotifyId: track.platformId, uri: track.uri }),
        ...(track.platform === 'soundcloud' && { soundcloudId: track.platformId }),
        ...(track.platform === 'beatport' && { beatportId: track.platformId }),
      }

      // Create song in database
      const songResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      })

      if (!songResponse.ok) {
        const errorData = await songResponse.json()
        throw new Error(errorData.error || 'Failed to create song')
      }

      const song = await songResponse.json()

      // Add song to playlist
      const success = await addSongToPlaylist(playlistId, {
        songId: song.id,
      })

      if (success) {
        toast({
          title: 'Song added',
          description: `"${track.name}" by ${track.artist} has been added to ${playlistName}.`,
        })
        // Notify parent component to refresh
        onSongAdded?.()
      } else {
        throw new Error('Failed to add song to playlist')
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error)
      toast({
        title: 'Error',
        description: 'Failed to add song to playlist. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAddingTracks(prev => {
        const newSet = new Set(prev)
        newSet.delete(track.id)
        return newSet
      })
    }
  }, [playlistId, playlistName, addSongToPlaylist])

  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  // Cleanup audio when dialog closes
  useEffect(() => {
    if (!open && currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      setCurrentAudio(null)
      setCurrentlyPlaying(null)
    }
  }, [open, currentAudio])

  const handlePlay = useCallback((track: SearchTrack) => {
    // If no preview URL available, open external URL if available
    if (!track.previewUrl) {
      if (track.url) {
        window.open(track.url, '_blank')
      } else {
        toast({
          title: 'No preview available',
          description: 'This track does not have a preview available.',
          variant: 'destructive',
        })
      }
      return
    }

    // If clicking the same track
    if (currentlyPlaying === track.id && currentAudio) {
      if (currentAudio.paused) {
        currentAudio.play()
          .catch((error: any) => {
            console.error('Error playing audio:', error)
            toast({
              title: 'Playback error',
              description: 'Unable to play the audio preview.',
              variant: 'destructive',
            })
          })
      } else {
        currentAudio.pause()
      }
      return
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
    }

    // Create new audio element
    const audio = new Audio(track.previewUrl)
    audio.volume = 0.7
    
    audio.onended = () => {
      setCurrentlyPlaying(null)
      setCurrentAudio(null)
    }
    
    audio.onerror = () => {
      setCurrentlyPlaying(null)
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
        setCurrentlyPlaying(track.id)
      })
      .catch((error: any) => {
        console.error('Error playing audio:', error)
        toast({
          title: 'Playback error',
          description: 'Unable to play the audio preview.',
          variant: 'destructive',
        })
      })
  }, [currentlyPlaying, currentAudio])

  const handleClose = () => {
    clearSearch()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Songs to {playlistName}</DialogTitle>
          <DialogDescription>
            Search for songs across Spotify, SoundCloud, and Beatport to add to your playlist.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Search Input */}
          <SearchInput
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
            platforms={platforms}
            onPlatformsChange={setPlatforms}
            loading={loading}
            placeholder="Search for songs, artists, or albums..."
          />

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            <SearchResults
              results={results}
              loading={loading}
              query={query}
              totalResults={totalResults}
              onAddToPlaylist={handleAddToPlaylist}
              onPlay={handlePlay}
              currentlyPlaying={currentlyPlaying || undefined}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {results.length > 0 && (
              <>Found {results.length} tracks from {platforms.length} platform{platforms.length !== 1 ? 's' : ''}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}