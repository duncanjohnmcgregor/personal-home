'use client'

import { useState, useCallback } from 'react'
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
}

export function AddSongsDialog({
  open,
  onOpenChange,
  playlistId,
  playlistName,
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
        throw new Error('Failed to create song')
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

  const handlePlay = useCallback((track: SearchTrack) => {
    // This would integrate with a music player
    // For now, we'll just open the external URL if available
    if (track.url) {
      window.open(track.url, '_blank')
    }
  }, [])

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