'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { PlaylistForm } from '@/components/playlist/playlist-form'
import { DraggablePlaylists } from '@/components/playlist/draggable-playlists'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { Playlist, CreatePlaylistData, UpdatePlaylistData } from '@/types/playlist'
import { toast } from '@/lib/hooks/use-toast'

export default function PlaylistsPage() {
  const {
    playlists,
    loading,
    error,
    fetchPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
    moveSongBetweenPlaylists,
  } = usePlaylists()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated')
  const [showForm, setShowForm] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch playlists on mount
  useEffect(() => {
    fetchPlaylists()
  }, [fetchPlaylists])

  // Filter and sort playlists
  const filteredPlaylists = playlists
    .filter((playlist) => {
      const matchesSearch = playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (playlist.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  const handleCreatePlaylist = async (data: CreatePlaylistData) => {
    setIsSubmitting(true)
    try {
      const result = await createPlaylist(data)
      if (result) {
        toast({
          title: 'Success',
          description: 'Playlist created successfully',
        })
        setShowForm(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePlaylist = async (data: UpdatePlaylistData) => {
    if (!editingPlaylist) return
    
    setIsSubmitting(true)
    try {
      const result = await updatePlaylist(editingPlaylist.id, data)
      if (result) {
        toast({
          title: 'Success',
          description: 'Playlist updated successfully',
        })
        setEditingPlaylist(null)
        setShowForm(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update playlist',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (!confirm(`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deletePlaylist(playlist.id)
      if (result) {
        toast({
          title: 'Success',
          description: 'Playlist deleted successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete playlist',
        variant: 'destructive',
      })
    }
  }

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPlaylist(null)
  }

  const handleSongMove = async (songId: string, fromPlaylistId: string, toPlaylistId: string, newIndex: number) => {
    try {
      const success = await moveSongBetweenPlaylists(songId, fromPlaylistId, toPlaylistId, newIndex)
      if (!success) {
        throw new Error('Failed to move song')
      }
    } catch (error) {
      throw error
    }
  }

  const handleSongReorder = async (playlistId: string, songIds: string[]) => {
    try {
      const result = await reorderPlaylistSongs(playlistId, { songIds })
      if (!result) {
        throw new Error('Failed to reorder songs')
      }
    } catch (error) {
      throw error
    }
  }

  const handleSongRemove = async (playlistId: string, songId: string) => {
    try {
      const success = await removeSongFromPlaylist(playlistId, { songId })
      if (!success) {
        throw new Error('Failed to remove song')
      }
      await fetchPlaylists() // Refresh playlists after removal
    } catch (error) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 header-mobile">
        <div className="text-content-mobile">
          <h1 className="text-2xl sm:text-3xl font-bold">Playlist Manager</h1>
          <p className="text-muted-foreground">
            Drag and drop songs between playlists
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="sm:flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          New Playlist
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Click on playlists to expand them, then drag songs between playlists or reorder them within a playlist.
        </p>
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

      {/* Empty State */}
      {!loading && !error && filteredPlaylists.length === 0 && playlists.length === 0 && (
        <EmptyState
          icon={Music}
          title="No playlists yet"
          description="Create your first playlist to get started"
          actionLabel="Create Playlist"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* No Results State */}
      {!loading && !error && filteredPlaylists.length === 0 && playlists.length > 0 && (
        <EmptyState
          icon={Music}
          title="No playlists found"
          description="Try adjusting your search"
        />
      )}

      {/* Draggable Playlists */}
      {filteredPlaylists.length > 0 && (
        <DraggablePlaylists
          playlists={filteredPlaylists}
          onSongMove={handleSongMove}
          onSongReorder={handleSongReorder}
          onSongRemove={handleSongRemove}
          onPlaylistEdit={handleEditPlaylist}
          onPlaylistDelete={handleDeletePlaylist}
        />
      )}

      {/* Playlist Form Dialog */}
      <PlaylistForm
        open={showForm}
        onOpenChange={handleFormClose}
        playlist={editingPlaylist || undefined}
        onSubmit={editingPlaylist ? 
          (data) => handleUpdatePlaylist(data as UpdatePlaylistData) : 
          (data) => handleCreatePlaylist(data as CreatePlaylistData)
        }
        isSubmitting={isSubmitting}
      />
    </div>
  )
}