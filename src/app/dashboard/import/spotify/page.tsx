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
import { ImportProgress, ImportProgressSummary } from '@/components/import/import-progress'
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

interface ImportQueue {
  jobs: ImportJob[]
  currentJobIndex: number
  isProcessing: boolean
}

export default function SpotifyImportPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [importQueue, setImportQueue] = useState<ImportQueue>({
    jobs: [],
    currentJobIndex: 0,
    isProcessing: false
  })
  const [importHistoryIds, setImportHistoryIds] = useState<Map<string, string>>(new Map())

  // Legacy state for backwards compatibility
  const importJobs = importQueue.jobs
  const importing = importQueue.isProcessing

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

  // Handle playlist selection - improved to work during imports
  const togglePlaylistSelection = (playlistId: string) => {
    // Allow selection changes even during import
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

  // Enhanced import function with proper queue management
  const importSelectedPlaylists = async () => {
    if (selectedPlaylists.size === 0) {
      toast({
        title: 'No playlists selected',
        description: 'Please select at least one playlist to import.',
        variant: 'destructive',
      })
      return
    }


    // If already importing, add new selections to the queue
    if (importing) {
      const newPlaylists = playlists.filter(p => 
        selectedPlaylists.has(p.id) && 
        !importJobs.some(job => job.playlistId === p.id)
      )
      
      if (newPlaylists.length > 0) {
        const newJobs: ImportJob[] = newPlaylists.map(playlist => ({
          id: `job-${playlist.id}`,
          playlistId: playlist.id,
          playlistName: playlist.name,
          totalTracks: playlist.tracks.total,
          importedTracks: 0,
          status: 'pending'
        }))
        
        setImportJobs(prev => [...prev, ...newJobs])
        
        toast({
          title: 'Added to queue',
          description: `Added ${newPlaylists.length} playlist(s) to the import queue.`,
        })
        
        // Import the new playlists
        for (const playlist of newPlaylists) {
          await importPlaylist(playlist)
        }
      }
      return
    }

    setImporting(true)
    const selectedPlaylistData = playlists.filter(p => selectedPlaylists.has(p.id))
    
    // Create new import jobs
    const newJobs: ImportJob[] = selectedPlaylistData.map(playlist => ({
      id: `job-${playlist.id}-${Date.now()}`,
      playlistId: playlist.id,
      playlistName: playlist.name,
      totalTracks: playlist.tracks.total,
      importedTracks: 0,
      status: 'pending'
    }))

    // Add jobs to queue
    setImportQueue(prev => ({
      ...prev,
      jobs: [...prev.jobs, ...newJobs]
    }))

    // Clear selection immediately after queuing
    setSelectedPlaylists(new Set())

    // Start processing if not already running
    if (!importQueue.isProcessing) {
      processImportQueue([...importQueue.jobs, ...newJobs])
    }

    toast({
      title: 'Playlists queued',
      description: `${selectedPlaylists.size} playlist(s) added to import queue.`,
    })
  }

     // Process the import queue sequentially
   const processImportQueue = async (jobs: ImportJob[]) => {
     if (jobs.length === 0) return

     setImportQueue((prev: ImportQueue) => ({ ...prev, isProcessing: true }))

    try {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]
        
        // Skip already completed or failed jobs
        if (job.status === 'completed' || job.status === 'failed') {
          continue
        }

                 setImportQueue((prev: ImportQueue) => ({ ...prev, currentJobIndex: i }))
         
         const playlist = playlists.find((p: SpotifyPlaylist) => p.id === job.playlistId)
        if (playlist) {
          await importPlaylist(playlist, job.id)
        }
      }
      
      toast({
        title: 'Import completed',
        description: `All queued playlists have been processed.`,
      })
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Failed to process import queue',
        variant: 'destructive',
      })
          } finally {
        setImportQueue((prev: ImportQueue) => ({ 
          ...prev, 
          isProcessing: false,
          currentJobIndex: 0
        }))
    }
  }

  const importPlaylist = async (playlist: SpotifyPlaylist, jobId?: string) => {
    // Update job status to importing
    setImportQueue(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => 
        (jobId && job.id === jobId) || (!jobId && job.playlistId === playlist.id)
          ? { ...job, status: 'importing' }
          : job
      )
    }))

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
            setImportQueue(prev => ({
              ...prev,
              jobs: prev.jobs.map(job => 
                (jobId && job.id === jobId) || (!jobId && job.playlistId === playlist.id)
                  ? { ...job, importedTracks: totalImported }
                  : job
              )
            }))

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
      setImportQueue(prev => ({
        ...prev,
        jobs: prev.jobs.map(job => 
          (jobId && job.id === jobId) || (!jobId && job.playlistId === playlist.id)
            ? { ...job, status: 'completed', importedTracks: totalImported }
            : job
        )
      }))

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
      setImportQueue(prev => ({
        ...prev,
        jobs: prev.jobs.map(job => 
          (jobId && job.id === jobId) || (!jobId && job.playlistId === playlist.id)
            ? { ...job, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' }
            : job
        )
      }))

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

  // Helper functions for queue status
  const getQueueStatus = () => {
    const totalJobs = importQueue.jobs.length
    const completedJobs = importQueue.jobs.filter(job => job.status === 'completed').length
    const failedJobs = importQueue.jobs.filter(job => job.status === 'failed').length
    const pendingJobs = importQueue.jobs.filter(job => job.status === 'pending').length
    const currentJob = importQueue.jobs[importQueue.currentJobIndex]
    
    return {
      totalJobs,
      completedJobs,
      failedJobs,
      pendingJobs,
      currentJob,
      progress: totalJobs > 0 ? ((completedJobs + failedJobs) / totalJobs) * 100 : 0
    }
  }

  const isPlaylistQueued = (playlistId: string) => {
    return importQueue.jobs.some(job => 
      job.playlistId === playlistId && (job.status === 'pending' || job.status === 'importing')
    )
  }

  const isPlaylistImporting = (playlistId: string) => {
    return importQueue.jobs.some(job => 
      job.playlistId === playlistId && job.status === 'importing'
    )
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
          <TabsTrigger value="progress">
            Current Import
            {importQueue.jobs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getQueueStatus().completedJobs + getQueueStatus().failedJobs}/{getQueueStatus().totalJobs}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Previous Imports</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="page-content">
          {/* Enhanced Selection Controls with Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Select Playlists to Import
                {importQueue.isProcessing && (
                  <Badge variant="default" className="bg-blue-500">
                    <LoadingSpinner className="w-3 h-3 mr-1" />
                    Processing Queue
                  </Badge>
                )}
              </CardTitle>
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
              
              {/* Queue Status Display */}
              {importQueue.jobs.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Import Queue Status</h4>
                    <div className="flex items-center space-x-2">
                      {getQueueStatus().currentJob && (
                        <Badge variant="outline" className="text-xs">
                          Current: {getQueueStatus().currentJob.playlistName}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {getQueueStatus().completedJobs + getQueueStatus().failedJobs}/{getQueueStatus().totalJobs} completed
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                      <span>Overall Progress</span>
                      <span>{Math.round(getQueueStatus().progress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getQueueStatus().progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPlaylists.size > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
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
                      disabled={false}
                    >
                      {importing ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                          {importJobs.some(job => job.status === 'pending') ? 'Add to Queue' : 'Importing...'}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Import Selected
                        </>
                      )}
                    </Button>
                  </div>

                  
                  {/* Show import progress beneath total count */}
                  {importJobs.length > 0 && (
                    <ImportProgressSummary jobs={importJobs} />
                  )}

                  <Button 
                    onClick={importSelectedPlaylists}
                    disabled={selectedPlaylists.size === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {importQueue.isProcessing ? 'Add to Queue' : 'Import Selected'}
                  </Button>

                </div>
              )}
            </CardContent>
          </Card>

          {/* Playlists Grid with Compact Layout */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredPlaylists.map((playlist) => (
                <SpotifyPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  selected={selectedPlaylists.has(playlist.id)}
                  onToggleSelect={() => togglePlaylistSelection(playlist.id)}
                  importing={isPlaylistImporting(playlist.id)}
                  queued={isPlaylistQueued(playlist.id) && !isPlaylistImporting(playlist.id)}
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
                  {importJobs.map((job, index) => (
                    <ImportProgress 
                      key={job.id} 
                      job={job}
                      isCurrentJob={importQueue.isProcessing && index === importQueue.currentJobIndex}
                      queuePosition={job.status === 'pending' ? index - importQueue.currentJobIndex : undefined}
                    />
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