'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Music, Users, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

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
}

interface ImportProgress {
  playlistId: string
  playlistName: string
  status: 'pending' | 'importing' | 'completed' | 'error'
  progress: number
  tracksImported: number
  totalTracks: number
  error?: string
}

export default function SpotifyImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'select' | 'import' | 'complete'>('select')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchSpotifyPlaylists()
    }
  }, [status, router])

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
      console.error('Error fetching playlists:', err)
      setError('Failed to fetch your Spotify playlists. Please try again.')
      toast.error('Failed to fetch playlists')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaylistSelection = (playlistId: string, checked: boolean) => {
    const newSelection = new Set(selectedPlaylists)
    if (checked) {
      newSelection.add(playlistId)
    } else {
      newSelection.delete(playlistId)
    }
    setSelectedPlaylists(newSelection)
  }

  const selectAllPlaylists = () => {
    setSelectedPlaylists(new Set(playlists.map(p => p.id)))
  }

  const deselectAllPlaylists = () => {
    setSelectedPlaylists(new Set())
  }

  const startImport = async () => {
    if (selectedPlaylists.size === 0) {
      toast.error('Please select at least one playlist to import')
      return
    }

    setImporting(true)
    setCurrentStep('import')
    
    // Initialize progress tracking
    const playlistIds = Array.from(selectedPlaylists) as string[]
    const initialProgress: ImportProgress[] = playlistIds.map((playlistId) => {
      const playlist = playlists.find(p => p.id === playlistId)!
      return {
        playlistId,
        playlistName: playlist.name,
        status: 'pending' as const,
        progress: 0,
        tracksImported: 0,
        totalTracks: playlist.tracks.total,
      }
    })
    setImportProgress(initialProgress)

    try {
      // Import playlists one by one
      for (const playlistId of playlistIds) {
        await importSinglePlaylist(playlistId)
      }
      
      setCurrentStep('complete')
      toast.success('Import completed successfully!')
    } catch (err) {
      console.error('Import failed:', err)
      toast.error('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const importSinglePlaylist = async (playlistId: string) => {
    try {
      // Update status to importing
      setImportProgress(prev => 
        prev.map(p => 
          p.playlistId === playlistId 
            ? { ...p, status: 'importing' as const }
            : p
        )
      )

      const response = await fetch('/api/spotify/import/playlist', {
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
      
      // Update progress to completed
      setImportProgress(prev => 
        prev.map(p => 
          p.playlistId === playlistId 
            ? { 
                ...p, 
                status: 'completed' as const,
                progress: 100,
                tracksImported: result.tracksImported || p.totalTracks
              }
            : p
        )
      )
    } catch (err) {
      console.error(`Failed to import playlist ${playlistId}:`, err)
      
      // Update progress to error
      setImportProgress(prev => 
        prev.map(p => 
          p.playlistId === playlistId 
            ? { 
                ...p, 
                status: 'error' as const,
                error: err instanceof Error ? err.message : 'Unknown error'
              }
            : p
        )
      )
    }
  }

  const resetImport = () => {
    setCurrentStep('select')
    setSelectedPlaylists(new Set())
    setImportProgress([])
    setImporting(false)
  }

  const getStatusIcon = (status: ImportProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'importing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ImportProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'importing':
        return <Badge variant="outline" className="text-blue-600">Importing...</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import from Spotify</h1>
          <p className="text-muted-foreground">
            Import your Spotify playlists to manage them across multiple platforms
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${currentStep === 'select' ? 'text-blue-600' : currentStep === 'import' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'select' ? 'border-blue-600 bg-blue-50' : currentStep === 'import' || currentStep === 'complete' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              1
            </div>
            <span className="font-medium">Select Playlists</span>
          </div>
          
          <div className={`w-8 h-0.5 ${currentStep === 'import' || currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center gap-2 ${currentStep === 'import' ? 'text-blue-600' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'import' ? 'border-blue-600 bg-blue-50' : currentStep === 'complete' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="font-medium">Import</span>
          </div>
          
          <div className={`w-8 h-0.5 ${currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'complete' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              3
            </div>
            <span className="font-medium">Complete</span>
          </div>
        </div>

        {/* Content based on current step */}
        {currentStep === 'select' && (
          <>
            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Your Spotify Playlists
                </CardTitle>
                <CardDescription>
                                     Select the playlists you want to import. We&apos;ll copy all tracks and preserve playlist information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading your playlists...</span>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No playlists found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Make sure you have playlists in your Spotify account
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Selection controls */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                      <span className="text-sm font-medium">
                        {selectedPlaylists.size} of {playlists.length} playlists selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllPlaylists}
                        disabled={selectedPlaylists.size === playlists.length}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAllPlaylists}
                        disabled={selectedPlaylists.size === 0}
                      >
                        Deselect All
                      </Button>
                    </div>

                    {/* Playlist list */}
                    <div className="space-y-4">
                      {playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedPlaylists.has(playlist.id)}
                            onCheckedChange={(checked) =>
                              handlePlaylistSelection(playlist.id, checked as boolean)
                            }
                          />
                          
                          <div className="flex-shrink-0">
                            {playlist.images?.[0]?.url ? (
                              <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="w-12 h-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
                                <Music className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {playlist.name}
                            </h3>
                            {playlist.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {playlist.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Music className="h-3 w-3" />
                                {playlist.tracks.total} tracks
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {playlist.owner.display_name}
                              </span>
                              {playlist.public && (
                                <Badge variant="outline" className="text-xs">
                                  Public
                                </Badge>
                              )}
                              {playlist.collaborative && (
                                <Badge variant="outline" className="text-xs">
                                  Collaborative
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Import button */}
                    <div className="flex justify-end mt-6 pt-4 border-t">
                      <Button
                        onClick={startImport}
                        disabled={selectedPlaylists.size === 0 || importing}
                        className="flex items-center gap-2"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Starting Import...
                          </>
                        ) : (
                          <>
                            Import {selectedPlaylists.size} Playlist{selectedPlaylists.size !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {currentStep === 'import' && (
          <Card>
            <CardHeader>
              <CardTitle>Importing Playlists</CardTitle>
              <CardDescription>
                Please wait while we import your selected playlists. This may take a few minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {importProgress.map((progress) => (
                  <div key={progress.playlistId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(progress.status)}
                        <span className="font-medium">{progress.playlistName}</span>
                        {getStatusBadge(progress.status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {progress.tracksImported} / {progress.totalTracks} tracks
                      </span>
                    </div>
                    
                    {progress.status === 'importing' && (
                      <Progress value={progress.progress} className="h-2" />
                    )}
                    
                    {progress.error && (
                      <p className="text-sm text-red-600">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Complete
              </CardTitle>
              <CardDescription>
                Your playlists have been successfully imported!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {importProgress.filter(p => p.status === 'completed').length}
                    </div>
                    <div className="text-sm text-green-600">Playlists Imported</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {importProgress.reduce((sum, p) => sum + p.tracksImported, 0)}
                    </div>
                    <div className="text-sm text-blue-600">Tracks Imported</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {importProgress.filter(p => p.status === 'error').length}
                    </div>
                    <div className="text-sm text-red-600">Errors</div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/dashboard/playlists')}
                    className="flex items-center gap-2"
                  >
                    <Music className="h-4 w-4" />
                    View My Playlists
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetImport}
                    className="flex items-center gap-2"
                  >
                    Import More Playlists
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}