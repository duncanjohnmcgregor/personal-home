'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SpotifyImportWizard } from '@/components/import/spotify-import-wizard'
import { SpotifyPlaylistCard } from '@/components/import/spotify-playlist-card'
import { ImportProgress } from '@/components/import/import-progress'
import { ImportHistory } from '@/components/import/import-history'
import { useToast } from '@/lib/hooks/use-toast'
import { Music, Search, Download, CheckCircle } from 'lucide-react'

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
    height?: number
    width?: number
  }>
  owner: {
    id: string
    display_name: string
  }
  external_urls: {
    spotify: string
  }
}

interface ImportJob {
  id: string
  playlistId: string
  playlistName: string
  totalTracks: number
  importedTracks: number
  status: 'pending' | 'importing' | 'completed' | 'failed'
  error?: string
}

export default function SpotifyImportPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [importJobs, setImportJobs] = useState<ImportJob[]>([])
  const [importing, setImporting] = useState(false)
  const [importHistoryIds, setImportHistoryIds] = useState<Map<string, string>>(new Map())

  // Fetch user's Spotify playlists
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSpotifyPlaylists()
    }
  }, [status])

  const fetchSpotifyPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/spotify/playlists?limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }
      
      const data = await response.json()
      setPlaylists(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists')
    } finally {
      setLoading(false)
    }
  }

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.owner.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle playlist selection
  const togglePlaylistSelection = (playlistId: string) => {
    const newSelection = new Set(selectedPlaylists)
    if (newSelection.has(playlistId)) {
      newSelection.delete(playlistId)
    } else {
      newSelection.add(playlistId)
    }
    setSelectedPlaylists(newSelection)
  }

  const selectAllPlaylists = () => {
    setSelectedPlaylists(new Set(filteredPlaylists.map(p => p.id)))
  }

  const deselectAllPlaylists = () => {
    setSelectedPlaylists(new Set())
  }

  // Import selected playlists
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
    const selectedPlaylistData = playlists.filter(p => selectedPlaylists.has(p.id))
    
    // Initialize import jobs
    const jobs: ImportJob[] = selectedPlaylistData.map(playlist => ({
      id: `job-${playlist.id}`,
      playlistId: playlist.id,
      playlistName: playlist.name,
      totalTracks: playlist.tracks.total,
      importedTracks: 0,
      status: 'pending'
    }))
    
    setImportJobs(jobs)

    try {
      // Import playlists one by one to avoid overwhelming the API
      for (const playlist of selectedPlaylistData) {
        await importPlaylist(playlist)
      }
      
      toast({
        title: 'Import completed',
        description: `Successfully imported ${selectedPlaylists.size} playlist(s).`,
      })
      
      // Clear selection after successful import
      setSelectedPlaylists(new Set())
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Failed to import playlists',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const importPlaylist = async (playlist: SpotifyPlaylist) => {
    // Update job status to importing
    setImportJobs(prev => prev.map(job => 
      job.playlistId === playlist.id 
        ? { ...job, status: 'importing' }
        : job
    ))

    let importHistoryId: string | null = null

    try {
      // Create the playlist in our database
      const createResponse = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlist.name,
          description: playlist.description || '',
          spotifyId: playlist.id,
          isPublic: playlist.public,
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create playlist: ${playlist.name}`)
      }

      const createdPlaylist = await createResponse.json()

      // Create import history record
      const historyResponse = await fetch('/api/import-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotifyPlaylistId: playlist.id,
          playlistName: playlist.name,
          totalTracks: playlist.tracks.total,
          playlistId: createdPlaylist.id,
        }),
      })

      if (historyResponse.ok) {
        const historyRecord = await historyResponse.json()
        importHistoryId = historyRecord.id
        setImportHistoryIds(prev => new Map(prev).set(playlist.id, historyRecord.id))
        
        // Update history status to importing
        await fetch(`/api/import-history/${historyRecord.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'IMPORTING' }),
        })
      }

      // Fetch and import tracks in batches
      let offset = 0
      const limit = 100
      let totalImported = 0

      while (offset < playlist.tracks.total) {
        const tracksResponse = await fetch(
          `/api/spotify/playlist/${playlist.id}/tracks?limit=${limit}&offset=${offset}`
        )
        
        if (!tracksResponse.ok) {
          throw new Error(`Failed to fetch tracks for playlist: ${playlist.name}`)
        }

        const tracksData = await tracksResponse.json()
        
        // Import tracks to database
        for (const item of tracksData.items) {
          if (item.track && item.track.id) {
            await importTrack(item.track, createdPlaylist.id, totalImported)
            totalImported++
            
            // Update progress
            setImportJobs(prev => prev.map(job => 
              job.playlistId === playlist.id 
                ? { ...job, importedTracks: totalImported }
                : job
            ))

            // Update import history progress
            if (importHistoryId) {
              await fetch(`/api/import-history/${importHistoryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ importedTracks: totalImported }),
              })
            }
          }
        }

        offset += limit
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Mark job as completed
      setImportJobs(prev => prev.map(job => 
        job.playlistId === playlist.id 
          ? { ...job, status: 'completed', importedTracks: totalImported }
          : job
      ))

      // Update import history as completed
      if (importHistoryId) {
        await fetch(`/api/import-history/${importHistoryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'COMPLETED',
            importedTracks: totalImported,
            completedAt: new Date().toISOString()
          }),
        })
      }

    } catch (err) {
      // Mark job as failed
      setImportJobs(prev => prev.map(job => 
        job.playlistId === playlist.id 
          ? { ...job, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' }
          : job
      ))

      // Update import history as failed
      if (importHistoryId) {
        await fetch(`/api/import-history/${importHistoryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'FAILED',
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
            completedAt: new Date().toISOString()
          }),
        })
      }
      
      throw err
    }
  }

  const importTrack = async (track: any, playlistId: string, position: number) => {
    try {
      // First, create or find the song
      const songResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          album: track.album.name,
          duration: track.duration_ms,
          spotifyId: track.id,
          previewUrl: track.preview_url,
          image: track.album.images[0]?.url,
        }),
      })

      if (!songResponse.ok) {
        console.warn(`Failed to create song: ${track.name}`)
        return
      }

      const song = await songResponse.json()

      // Add song to playlist
      await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: song.id,
          position,
        }),
      })
    } catch (err) {
      console.warn(`Failed to import track: ${track.name}`, err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <EmptyState
        icon={Music}
        title="Authentication Required"
        description="Please sign in to import your Spotify playlists."
      />
    )
  }

  return (
    <div className="page-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 header-mobile">
        <div className="text-content-mobile">
          <h1 className="text-2xl sm:text-3xl font-bold">Import from Spotify</h1>
          <p className="text-muted-foreground">
            Import your Spotify playlists and songs to your music library
          </p>
        </div>
        <Button onClick={fetchSpotifyPlaylists} disabled={loading} className="sm:flex-shrink-0">
          <Search className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="playlists" className="page-content">
        <TabsList>
          <TabsTrigger value="playlists">Your Playlists</TabsTrigger>
          <TabsTrigger value="progress">Current Import</TabsTrigger>
          <TabsTrigger value="history">Previous Imports</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="page-content">
          {/* Search and Selection Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Select Playlists to Import</CardTitle>
              <CardDescription>
                Choose which playlists you want to import from your Spotify account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search playlists</Label>
                  <Input
                    id="search"
                    placeholder="Search by name, description, or owner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={selectAllPlaylists}>
                    Select All
                  </Button>
                  <Button variant="outline" onClick={deselectAllPlaylists}>
                    Deselect All
                  </Button>
                </div>
              </div>
              
              {selectedPlaylists.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {selectedPlaylists.size} playlist(s) selected
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Total tracks: {playlists
                        .filter(p => selectedPlaylists.has(p.id))
                        .reduce((sum, p) => sum + p.tracks.total, 0)}
                    </span>
                  </div>
                  <Button 
                    onClick={importSelectedPlaylists}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import Selected
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Playlists Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : filteredPlaylists.length === 0 ? (
            <EmptyState
              icon={Music}
              title="No playlists found"
              description={searchQuery ? "No playlists match your search." : "You don't have any Spotify playlists."}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-mobile">
              {filteredPlaylists.map((playlist) => (
                <SpotifyPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  selected={selectedPlaylists.has(playlist.id)}
                  onToggleSelect={() => togglePlaylistSelection(playlist.id)}
                  importing={importing && selectedPlaylists.has(playlist.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="page-content">
          <Card>
            <CardHeader>
              <CardTitle>Current Import Progress</CardTitle>
              <CardDescription>
                Track the progress of your current playlist imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importJobs.length === 0 ? (
                <EmptyState
                  icon={Download}
                  title="No imports running"
                  description="Start importing playlists to see progress here."
                />
              ) : (
                <div className="space-y-4">
                  {importJobs.map((job) => (
                    <ImportProgress key={job.id} job={job} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="page-content">
          <Card>
            <CardHeader>
              <CardTitle>Previous Imports</CardTitle>
              <CardDescription>
                View the history of your Spotify playlist imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}