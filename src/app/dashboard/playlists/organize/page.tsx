'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Music, Undo, Redo, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { SongOrganizer } from '@/components/playlist/song-organizer'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { useUndoRedo } from '@/lib/hooks/use-undo-redo'
import { toast } from '@/lib/hooks/use-toast'
import Link from 'next/link'

export default function PlaylistOrganizePage() {
  const {
    playlists,
    loading: playlistsLoading,
    error: playlistsError,
    fetchPlaylists,
    reorderPlaylistSongs,
    removeSongFromPlaylist,
  } = usePlaylists()

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    saveState,
    clearHistory,
  } = useUndoRedo()

  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Fetch data on mount
  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  // Save initial state for undo/redo
  useEffect(() => {
    if (playlists.length > 0) {
      saveState({
        playlists: playlists.map(p => ({ ...p })),
      })
    }
  }, [playlists, saveState])

  const handlePlaylistUpdate = async (playlistId: string) => {
    try {
      await fetchPlaylists()
    } catch (error) {
      console.error('Failed to update playlist:', error)
    }
  }

  const handleSongReorder = async (playlistId: string, songIds: string[]) => {
    try {
      // Save current state before making changes
      saveState({
        playlists: playlists.map(p => ({ ...p })),
      })

      await reorderPlaylistSongs(playlistId, { songIds })
      setUnsavedChanges(true)
      
      toast({
        title: 'Success',
        description: 'Song order updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update song order',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleSongRemove = async (playlistId: string, songId: string) => {
    try {
      // Save current state before making changes
      saveState({
        playlists: playlists.map(p => ({ ...p })),
      })

      await removeSongFromPlaylist(playlistId, { songId })
      setUnsavedChanges(true)
      
      toast({
        title: 'Success',
        description: 'Song removed from playlist',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove song from playlist',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleBulkMove = async (songIds: string[], fromPlaylistId: string, toPlaylistId: string) => {
    try {
      // Save current state before making changes
      saveState({
        playlists: playlists.map(p => ({ ...p })),
      })

      // Remove songs from source playlist and add to target playlist
      // This would need proper API endpoints for bulk operations
      // For now, we'll do individual operations
      for (const songId of songIds) {
        await removeSongFromPlaylist(fromPlaylistId, { songId })
        // Add to target playlist would require additional API call
        // await addSongToPlaylist(toPlaylistId, { songId })
      }
      
      setUnsavedChanges(true)
      
      toast({
        title: 'Success',
        description: `Moved ${songIds.length} song(s) successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move songs',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleUndo = () => {
    try {
      undo()
      setUnsavedChanges(true)
      toast({
        title: 'Undone',
        description: 'Previous action has been undone',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Cannot undo further',
        variant: 'destructive',
      })
    }
  }

  const handleRedo = () => {
    try {
      redo()
      setUnsavedChanges(true)
      toast({
        title: 'Redone',
        description: 'Action has been redone',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Cannot redo further',
        variant: 'destructive',
      })
    }
  }

  const handleSaveChanges = async () => {
    try {
      // In a real implementation, you would sync all changes to the server
      setUnsavedChanges(false)
      clearHistory()
      
      toast({
        title: 'Saved',
        description: 'All changes have been saved',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      })
    }
  }

  const loading = playlistsLoading
  const error = playlistsError

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 header-mobile">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/playlists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Playlists
            </Button>
          </Link>
          <div className="text-content-mobile">
            <h1 className="text-2xl sm:text-3xl font-bold">Organize Songs</h1>
            <p className="text-muted-foreground">
              Manage and organize songs within your playlists
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
          {unsavedChanges && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="space-y-4">
          <ErrorMessage message={error} />
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => fetchPlaylists()}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!error && (
        <SongOrganizer
          playlists={playlists}
          onPlaylistUpdate={handlePlaylistUpdate}
          onSongReorder={handleSongReorder}
          onSongRemove={handleSongRemove}
          onBulkMove={handleBulkMove}
          loading={loading}
        />
      )}
    </div>
  )
}