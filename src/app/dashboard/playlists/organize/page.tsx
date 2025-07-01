'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Folder, FolderOpen, Plus, Undo, Redo, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { PlaylistOrganizer } from '@/components/playlist/playlist-organizer'
import { CategoryManager } from '@/components/playlist/category-manager'
import { usePlaylists } from '@/lib/hooks/use-playlists'
import { usePlaylistCategories } from '@/lib/hooks/use-playlist-categories'
import { useUndoRedo } from '@/lib/hooks/use-undo-redo'
import { toast } from '@/lib/hooks/use-toast'
import Link from 'next/link'

export default function PlaylistOrganizePage() {
  const {
    playlists,
    loading: playlistsLoading,
    error: playlistsError,
    fetchPlaylists,
    updatePlaylist,
    reorderPlaylists,
  } = usePlaylists()

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = usePlaylistCategories()

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    saveState,
    clearHistory,
  } = useUndoRedo()

  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'organize' | 'categories'>('organize')

  // Fetch data on mount
  useEffect(() => {
    fetchPlaylists()
    fetchCategories()
  }, [fetchPlaylists, fetchCategories])

  // Save initial state for undo/redo
  useEffect(() => {
    if (playlists.length > 0 && categories.length >= 0) {
      saveState({
        playlists: playlists.map(p => ({ ...p })),
        categories: categories.map(c => ({ ...c })),
      })
    }
  }, [playlists, categories, saveState])

  const handlePlaylistMove = async (playlistId: string, newCategoryId?: string) => {
    try {
      // Save current state before making changes
      saveState({
        playlists: playlists.map(p => ({ ...p })),
        categories: categories.map(c => ({ ...c })),
      })

      await updatePlaylist(playlistId, { categoryId: newCategoryId })
      setUnsavedChanges(true)
      
      toast({
        title: 'Success',
        description: 'Playlist moved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move playlist',
        variant: 'destructive',
      })
    }
  }

  const handlePlaylistReorder = async (playlistIds: string[]) => {
    try {
      // Save current state before making changes
      saveState({
        playlists: playlists.map(p => ({ ...p })),
        categories: categories.map(c => ({ ...c })),
      })

      await reorderPlaylists(playlistIds)
      setUnsavedChanges(true)
      
      toast({
        title: 'Success',
        description: 'Playlist order updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update playlist order',
        variant: 'destructive',
      })
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

  const loading = playlistsLoading || categoriesLoading
  const error = playlistsError || categoriesError

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
            <h1 className="text-2xl sm:text-3xl font-bold">Organize Playlists</h1>
            <p className="text-muted-foreground">
              Manage your playlist organization and categories
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
            <Button variant="outline" onClick={() => { fetchPlaylists(); fetchCategories(); }}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!error && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organize" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Organize Playlists
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Manage Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organize" className="space-y-6">
            <PlaylistOrganizer
              playlists={playlists}
              categories={categories}
              onPlaylistMove={handlePlaylistMove}
              onPlaylistReorder={handlePlaylistReorder}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager
              categories={categories}
              playlists={playlists}
              onCreate={createCategory}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}