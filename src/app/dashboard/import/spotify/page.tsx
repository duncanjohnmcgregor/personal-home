'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/lib/hooks/use-toast'
import { Loader2, Music, Users, Globe, Lock } from 'lucide-react'
import Image from 'next/image'

interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  public: boolean
  collaborative: boolean
  tracks: {
    total: number
  }
  images: Array<{
    url: string
  }>
  owner: {
    display_name: string
  }
}

interface ImportProgress {
  playlistId: string
  playlistName: string
  totalTracks: number
  importedTracks: number
  status: 'pending' | 'importing' | 'completed' | 'failed'
  error?: string
}

export default function SpotifyImportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<Map<string, ImportProgress>>(new Map())
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async (loadMore = false) => {
    try {
      setLoading(true)
      const currentOffset = loadMore ? offset : 0
      const response = await fetch(`/api/spotify/playlists?limit=50&offset=${currentOffset}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }

      const data = await response.json()
      
      if (loadMore) {
        setPlaylists(prev => [...prev, ...data.items])
      } else {
        setPlaylists(data.items)
      }
      
      setHasMore(data.next !== null)
      setOffset(currentOffset + data.items.length)
    } catch (error) {
      console.error('Error fetching playlists:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch your Spotify playlists. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePlaylistSelection = (playlistId: string) => {
    const newSelection = new Set(selectedPlaylists)
    if (newSelection.has(playlistId)) {
      newSelection.delete(playlistId)
    } else {
      newSelection.add(playlistId)
    }
    setSelectedPlaylists(newSelection)
  }

  const selectAll = () => {
    if (selectedPlaylists.size === playlists.length) {
      setSelectedPlaylists(new Set())
    } else {
      setSelectedPlaylists(new Set(playlists.map(p => p.id)))
    }
  }

  const importSelectedPlaylists = async () => {
    if (selectedPlaylists.size === 0) {
      toast({
        title: 'No playlists selected',
        description: 'Please select at least one playlist to import.',
        variant: 'destructive',
      })
      return
    }

    setImporting(true)
    const progressMap = new Map<string, ImportProgress>()

    // Initialize progress for selected playlists
    selectedPlaylists.forEach(playlistId => {
      const playlist = playlists.find(p => p.id === playlistId)
      if (playlist) {
        progressMap.set(playlistId, {
          playlistId,
          playlistName: playlist.name,
          totalTracks: playlist.tracks.total,
          importedTracks: 0,
          status: 'pending'
        })
      }
    })
    setImportProgress(progressMap)

    // Import playlists one by one
    for (const playlistId of Array.from(selectedPlaylists)) {
      try {
        // Update status to importing
        progressMap.set(playlistId, {
          ...progressMap.get(playlistId)!,
          status: 'importing'
        })
        setImportProgress(new Map(progressMap))

        // Import the playlist
        const response = await fetch('/api/spotify/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playlistId }),
        })

        if (!response.ok) {
          throw new Error('Failed to import playlist')
        }

        const result = await response.json()

        // Update progress with completion
        progressMap.set(playlistId, {
          ...progressMap.get(playlistId)!,
          importedTracks: result.importedTracks,
          status: 'completed'
        })
        setImportProgress(new Map(progressMap))
      } catch (error) {
        console.error(`Error importing playlist ${playlistId}:`, error)
        progressMap.set(playlistId, {
          ...progressMap.get(playlistId)!,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        setImportProgress(new Map(progressMap))
      }
    }

    setImporting(false)

    // Check if all imports were successful
    const allSuccessful = Array.from(progressMap.values()).every(p => p.status === 'completed')
    
    if (allSuccessful) {
      toast({
        title: 'Import completed',
        description: `Successfully imported ${selectedPlaylists.size} playlist(s).`,
      })
      
      // Redirect to playlists page after a short delay
      setTimeout(() => {
        router.push('/dashboard/playlists')
      }, 2000)
    } else {
      const failed = Array.from(progressMap.values()).filter(p => p.status === 'failed').length
      toast({
        title: 'Import partially completed',
        description: `Imported ${selectedPlaylists.size - failed} playlist(s). ${failed} failed.`,
        variant: 'destructive',
      })
    }
  }

  const getProgressPercentage = (progress: ImportProgress): number => {
    if (progress.status === 'pending') return 0
    if (progress.status === 'completed') return 100
    if (progress.status === 'failed') return 0
    return Math.round((progress.importedTracks / progress.totalTracks) * 100)
  }

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import from Spotify</h1>
        <p className="text-muted-foreground mt-2">
          Select playlists from your Spotify account to import into your music library.
        </p>
      </div>

      {/* Import Progress */}
      {importProgress.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
            <CardDescription>
              Importing {importProgress.size} playlist(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(importProgress.values()).map(progress => (
              <div key={progress.playlistId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{progress.playlistName}</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.status === 'completed' && '✓ Completed'}
                    {progress.status === 'failed' && '✗ Failed'}
                    {progress.status === 'importing' && `${progress.importedTracks}/${progress.totalTracks} tracks`}
                    {progress.status === 'pending' && 'Waiting...'}
                  </span>
                </div>
                <Progress value={getProgressPercentage(progress)} className="h-2" />
                {progress.error && (
                  <p className="text-xs text-destructive">{progress.error}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Playlist Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Spotify Playlists</CardTitle>
              <CardDescription>
                Select the playlists you want to import
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={importing}
              >
                {selectedPlaylists.size === playlists.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={importSelectedPlaylists}
                disabled={selectedPlaylists.size === 0 || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${selectedPlaylists.size} Playlist${selectedPlaylists.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPlaylists.has(playlist.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => togglePlaylistSelection(playlist.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedPlaylists.has(playlist.id)}
                    onCheckedChange={() => togglePlaylistSelection(playlist.id)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={importing}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      {playlist.images[0]?.url ? (
                        <Image
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Music className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium line-clamp-1">{playlist.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {playlist.tracks.total} tracks
                        </p>
                      </div>
                    </div>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {playlist.owner.display_name}
                      </span>
                      {playlist.public ? (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => fetchPlaylists(true)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Playlists'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}