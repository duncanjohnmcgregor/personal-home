'use client'

import { useState, useCallback } from 'react'
import { Check, Move, Trash2, X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { PlaylistSong, Playlist } from '@/types/playlist'
import { SongItem } from './song-item'
import { toast } from '@/lib/hooks/use-toast'

interface BulkSongManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songs: PlaylistSong[]
  playlists: Playlist[]
  currentPlaylistId: string
  onMoveSongs: (songIds: string[], targetPlaylistId: string) => Promise<void>
  onRemoveSongs: (songIds: string[]) => Promise<void>
  loading?: boolean
}

interface SongSelection {
  [songId: string]: boolean
}

export function BulkSongManager({
  open,
  onOpenChange,
  songs,
  playlists,
  currentPlaylistId,
  onMoveSongs,
  onRemoveSongs,
  loading = false,
}: BulkSongManagerProps) {
  const [selectedSongs, setSelectedSongs] = useState<SongSelection>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'position' | 'title' | 'artist' | 'addedAt'>('position')
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedCount = Object.values(selectedSongs).filter(Boolean).length
  const selectedSongIds = Object.keys(selectedSongs).filter(id => selectedSongs[id])

  // Filter and sort songs
  const filteredSongs = songs
    .filter(playlistSong => {
      const song = playlistSong.song
      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.album?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.song.title.localeCompare(b.song.title)
        case 'artist':
          return a.song.artist.localeCompare(b.song.artist)
        case 'addedAt':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        case 'position':
        default:
          return a.position - b.position
      }
    })

  const handleSelectSong = useCallback((songId: string, selected: boolean) => {
    setSelectedSongs(prev => ({
      ...prev,
      [songId]: selected,
    }))
  }, [])

  const handleSelectAll = useCallback(() => {
    const allSelected = filteredSongs.every(ps => selectedSongs[ps.songId])
    const newSelection: SongSelection = {}
    
    if (!allSelected) {
      // Select all filtered songs
      filteredSongs.forEach(ps => {
        newSelection[ps.songId] = true
      })
    }
    // If all are selected, deselect all (empty object)
    
    setSelectedSongs(newSelection)
  }, [filteredSongs, selectedSongs])

  const handleMoveSongs = async (targetPlaylistId: string) => {
    if (selectedSongIds.length === 0) return

    setIsProcessing(true)
    try {
      await onMoveSongs(selectedSongIds, targetPlaylistId)
      setSelectedSongs({})
      toast({
        title: 'Success',
        description: `Moved ${selectedSongIds.length} song(s) to selected playlist`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move songs',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveSongs = async () => {
    if (selectedSongIds.length === 0) return

    const confirmMessage = `Are you sure you want to remove ${selectedSongIds.length} song(s) from this playlist?`
    if (!confirm(confirmMessage)) return

    setIsProcessing(true)
    try {
      await onRemoveSongs(selectedSongIds)
      setSelectedSongs({})
      toast({
        title: 'Success',
        description: `Removed ${selectedSongIds.length} song(s) from playlist`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove songs',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedSongs({})
    setSearchQuery('')
    onOpenChange(false)
  }

  const availablePlaylists = playlists.filter(p => p.id !== currentPlaylistId)
  const allSelected = filteredSongs.length > 0 && filteredSongs.every(ps => selectedSongs[ps.songId])
  const someSelected = filteredSongs.some(ps => selectedSongs[ps.songId])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bulk Song Management
            {selectedCount > 0 && (
              <Badge variant="secondary">
                {selectedCount} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Position</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="addedAt">Date Added</SelectItem>
              </SelectContent>
            </Select>

            {/* Select All */}
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={filteredSongs.length === 0}
            >
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                className="mr-2"
              />
              Select All
            </Button>
          </div>

          {/* Actions */}
          {selectedCount > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm font-medium">
                  {selectedCount} song(s) selected
                </span>
              </div>

              {/* Move to Playlist */}
              {availablePlaylists.length > 0 && (
                <Select onValueChange={handleMoveSongs} disabled={isProcessing}>
                  <SelectTrigger className="w-[180px]">
                    <Move className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Move to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlaylists.map(playlist => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Remove */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveSongs}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>

              {/* Clear Selection */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSongs({})}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          )}

          {/* Songs List */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : filteredSongs.length === 0 ? (
              <EmptyState
                title="No songs found"
                description={searchQuery ? "Try adjusting your search" : "No songs in this playlist"}
              />
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1 p-1">
                  {filteredSongs.map((playlistSong) => (
                    <div
                      key={playlistSong.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedSongs[playlistSong.songId] || false}
                        onCheckedChange={(checked) => 
                          handleSelectSong(playlistSong.songId, checked === true)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <SongItem
                          playlistSong={playlistSong}
                          position={playlistSong.position}
                          showPosition={true}
                          showPreviewButton={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredSongs.length} song(s) • {selectedCount} selected
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}