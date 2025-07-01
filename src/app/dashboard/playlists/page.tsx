'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { PlaylistCard } from '@/components/playlist/playlist-card'
import { PlaylistForm } from '@/components/playlist/playlist-form'
import { PlaylistManager } from '@/components/playlist/playlist-manager'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { Playlist, CreatePlaylistData, UpdatePlaylistData } from '@/types/playlist'
import { toast } from '@/lib/hooks/use-toast'

export default function PlaylistsPage() {
  const {
    playlists,
    loading,
    error,
    pagination,
    fetchPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    reorderPlaylists,
  } = usePlaylists()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated')
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
      
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'public' && playlist.isPublic) ||
        (filterBy === 'private' && !playlist.isPublic)
      
      return matchesSearch && matchesFilter
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

  const handleReorderPlaylists = async (playlistIds: string[]) => {
    try {
      const success = await reorderPlaylists(playlistIds)
      if (!success) {
        throw new Error('Failed to reorder playlists')
      }
    } catch (error) {
      // Let the component handle the error display
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
          <h1 className="text-2xl sm:text-3xl font-bold">My Playlists</h1>
          <p className="text-muted-foreground">
            Manage your music collections
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="sm:flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          New Playlist
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="button-group-mobile">
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
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as typeof filterBy)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
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

      {/* Empty State */}
      {!loading && !error && filteredPlaylists.length === 0 && playlists.length === 0 && (
        <EmptyState
          title="No playlists yet"
          description="Create your first playlist to get started"
          actionLabel="Create Playlist"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* No Results State */}
      {!loading && !error && filteredPlaylists.length === 0 && playlists.length > 0 && (
        <EmptyState
          title="No playlists found"
          description="Try adjusting your search or filters"
        />
      )}

      {/* Playlist Grid/List */}
      {filteredPlaylists.length > 0 && (
        <PlaylistManager
          playlists={filteredPlaylists}
          viewMode={viewMode}
          onEdit={handleEditPlaylist}
          onDelete={handleDeletePlaylist}
          onReorder={handleReorderPlaylists}
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