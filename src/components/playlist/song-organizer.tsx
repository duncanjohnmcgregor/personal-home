'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Music, 
  ArrowUpDown, 
  Filter, 
  Search, 
  SortAsc, 
  SortDesc,
  Clock,
  User,
  Album,
  Zap,
  CheckCircle,
  Copy,
  Trash2
} from 'lucide-react'
import { Playlist, PlaylistSong } from '@/types/playlist'
import { PlaylistSongManager } from './playlist-song-manager'

interface SongOrganizerProps {
  playlists: Playlist[]
  onPlaylistUpdate: (playlistId: string) => Promise<void>
  onSongReorder: (playlistId: string, songIds: string[]) => Promise<void>
  onSongRemove: (playlistId: string, songId: string) => Promise<void>
  onBulkMove: (songIds: string[], fromPlaylistId: string, toPlaylistId: string) => Promise<void>
  loading?: boolean
}

type SortOption = 'position' | 'title' | 'artist' | 'album' | 'duration' | 'bpm' | 'addedAt'
type SortDirection = 'asc' | 'desc'

export function SongOrganizer({
  playlists,
  onPlaylistUpdate,
  onSongReorder,
  onSongRemove,
  onBulkMove,
  loading = false,
}: SongOrganizerProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('position')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [targetPlaylist, setTargetPlaylist] = useState<string>('')

  const playlist = playlists.find(p => p.id === selectedPlaylist)

  // Reset selection when changing playlists
  useEffect(() => {
    setSelectedSongs(new Set())
    setIsSelectionMode(false)
  }, [selectedPlaylist])

  // Filter and sort songs
  const filteredAndSortedSongs = playlist?.songs
    ?.filter(playlistSong => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      const song = playlistSong.song
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album?.toLowerCase().includes(query)
      )
    })
    ?.sort((a, b) => {
      const aValue = getSortValue(a, sortBy)
      const bValue = getSortValue(b, sortBy)
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    }) || []

  function getSortValue(playlistSong: PlaylistSong, sortBy: SortOption): any {
    switch (sortBy) {
      case 'position':
        return playlistSong.position
      case 'title':
        return playlistSong.song.title.toLowerCase()
      case 'artist':
        return playlistSong.song.artist.toLowerCase()
      case 'album':
        return playlistSong.song.album?.toLowerCase() || ''
      case 'duration':
        return playlistSong.song.duration || 0
      case 'bpm':
        return playlistSong.song.bpm || 0
      case 'addedAt':
        return new Date(playlistSong.addedAt).getTime()
      default:
        return 0
    }
  }

  const handleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('asc')
    }
  }

  const handleSongSelection = (songId: string, selected: boolean) => {
    const newSelection = new Set(selectedSongs)
    if (selected) {
      newSelection.add(songId)
    } else {
      newSelection.delete(songId)
    }
    setSelectedSongs(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedSongs.size === filteredAndSortedSongs.length) {
      setSelectedSongs(new Set())
    } else {
      const allSongIds = filteredAndSortedSongs.map(ps => ps.song.id)
      setSelectedSongs(new Set(allSongIds))
    }
  }

  const handleBulkMove = async () => {
    if (!selectedPlaylist || !targetPlaylist || selectedSongs.size === 0) return

    try {
      await onBulkMove(Array.from(selectedSongs), selectedPlaylist, targetPlaylist)
      setSelectedSongs(new Set())
      setIsSelectionMode(false)
      setTargetPlaylist('')
      await onPlaylistUpdate(selectedPlaylist)
      await onPlaylistUpdate(targetPlaylist)
    } catch (error) {
      console.error('Failed to move songs:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedPlaylist || selectedSongs.size === 0) return

    const confirmed = confirm(`Are you sure you want to remove ${selectedSongs.size} song(s) from this playlist?`)
    if (!confirmed) return

    try {
      const songIdsArray: string[] = Array.from(selectedSongs)
      for (const songId of songIdsArray) {
        await onSongRemove(selectedPlaylist, songId)
      }
      setSelectedSongs(new Set())
      setIsSelectionMode(false)
      await onPlaylistUpdate(selectedPlaylist)
    } catch (error) {
      console.error('Failed to remove songs:', error)
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '--'
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!loading && playlists.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No playlists to organize"
        description="Create some playlists with songs to organize them"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Playlist Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Select Playlist to Organize
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-select">Choose Playlist</Label>
              <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a playlist..." />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map(playlist => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{playlist.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {playlist._count.songs} songs
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {playlist && (
              <div className="space-y-2">
                <Label>Playlist Info</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    {playlist._count.songs} songs
                  </div>
                  {playlist.description && (
                    <p className="text-xs">{playlist.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Song Organization Tools */}
      {playlist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Organize Songs in "{playlist.name}"
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isSelectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                >
                  {isSelectionMode ? 'Exit Selection' : 'Select Songs'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Sort Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Songs</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by title, artist, or album..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: SortOption) => handleSort(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="position">Position</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                      <SelectItem value="bpm">BPM</SelectItem>
                      <SelectItem value="addedAt">Date Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort Direction</Label>
                  <Button
                    variant="outline"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="w-full justify-start"
                  >
                    {sortDirection === 'asc' ? (
                      <SortAsc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortDesc className="h-4 w-4 mr-2" />
                    )}
                    {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {isSelectionMode && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {selectedSongs.size === filteredAndSortedSongs.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedSongs.size} song(s) selected
                      </span>
                    </div>
                  </div>

                  {selectedSongs.size > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="target-playlist">Move to:</Label>
                        <Select value={targetPlaylist} onValueChange={setTargetPlaylist}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Choose playlist..." />
                          </SelectTrigger>
                          <SelectContent>
                            {playlists
                              .filter(p => p.id !== selectedPlaylist)
                              .map(playlist => (
                                <SelectItem key={playlist.id} value={playlist.id}>
                                  {playlist.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkMove}
                        disabled={!targetPlaylist}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Move Songs
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove from Playlist
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Song List */}
              <div className="min-h-[400px]">
                {filteredAndSortedSongs.length === 0 ? (
                  <EmptyState
                    icon={Music}
                    title={searchQuery ? "No songs match your search" : "No songs in this playlist"}
                    description={searchQuery ? "Try adjusting your search terms" : "Add some songs to this playlist to organize them"}
                  />
                ) : (
                  <div className="space-y-2">
                    {/* Enhanced Song List with Selection */}
                    {filteredAndSortedSongs.map((playlistSong, index) => (
                      <div key={playlistSong.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedSongs.has(playlistSong.song.id)}
                            onChange={(e) => handleSongSelection(playlistSong.song.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                        )}
                        
                        <div className="w-8 text-sm text-muted-foreground text-center">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{playlistSong.song.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {playlistSong.song.artist}
                            {playlistSong.song.album && ` • ${playlistSong.song.album}`}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {playlistSong.song.bpm && (
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {playlistSong.song.bpm}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(playlistSong.song.duration)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}