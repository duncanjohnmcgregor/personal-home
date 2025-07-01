'use client'

import { useEffect } from 'react'
import { Folder, Music } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { SimpleDraggablePlaylists } from '@/components/playlist/simple-draggable-playlists'
import { usePlaylists } from '@/lib/hooks/use-playlists'

export default function PlaylistsPage() {
  const {
    playlists,
    loading,
    error,
    fetchPlaylists,
    moveSongBetweenPlaylists,
  } = usePlaylists()

  // Fetch playlists on mount
  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  const handleSongMove = async (songId: string, fromPlaylistId: string, toPlaylistId: string) => {
    try {
      const success = await moveSongBetweenPlaylists(songId, fromPlaylistId, toPlaylistId, 0)
      if (!success) {
        throw new Error('Failed to move song')
      }
    } catch (error) {
      console.error('Error moving song:', error)
      throw error
    }
  }

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="text-content-mobile">
        <h1 className="text-2xl sm:text-3xl font-bold">My Playlists</h1>
        <p className="text-muted-foreground">
          Drag songs between playlists to organize your music
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Folder className="h-4 w-4" />
          <span className="font-medium">How it works:</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Click on a playlist to expand it and see its songs. Then drag any song to another playlist to move it there.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage message={error} />
      )}

      {/* Empty State */}
      {!loading && !error && playlists.length === 0 && (
        <EmptyState
          icon={Music}
          title="No playlists found"
          description="Import some playlists to get started with organizing your music"
        />
      )}

      {/* Simple Draggable Playlists */}
      {playlists.length > 0 && (
        <SimpleDraggablePlaylists
          playlists={playlists}
          onSongMove={handleSongMove}
        />
      )}
    </div>
  )
}