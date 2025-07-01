'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { CheckCircle, XCircle, Clock, Download, ExternalLink, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ImportHistoryItem {
  id: string
  spotifyPlaylistId: string
  playlistName: string
  totalTracks: number
  importedTracks: number
  status: 'PENDING' | 'IMPORTING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  startedAt: string
  completedAt?: string
  playlist?: {
    id: string
    name: string
    image?: string
  }
}

interface ImportHistoryResponse {
  items: ImportHistoryItem[]
  total: number
  limit: number
  offset: number
}

export function ImportHistory() {
  const [history, setHistory] = useState<ImportHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHistory = async () => {
    try {
      setError(null)
      const response = await fetch('/api/import-history?limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch import history')
      }
      const data: ImportHistoryResponse = await response.json()
      setHistory(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch import history')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchHistory()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-muted-foreground" />
      case 'IMPORTING':
        return <LoadingSpinner className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'IMPORTING':
        return <Badge variant="default">Importing</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getProgress = (item: ImportHistoryItem) => {
    return item.totalTracks > 0 ? (item.importedTracks / item.totalTracks) * 100 : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={Download}
        title="No import history"
        description="Your playlist import history will appear here once you start importing playlists from Spotify."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Import History</h3>
          <p className="text-sm text-muted-foreground">
            {history.length} import{history.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{item.playlistName}</h4>
                        {item.playlist && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-6 px-2"
                          >
                            <a
                              href={`/dashboard/playlists/${item.playlist.id}`}
                              className="flex items-center"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          {item.importedTracks} of {item.totalTracks} tracks
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(item.startedAt), { addSuffix: true })}
                        </span>
                        {item.completedAt && (
                          <>
                            <span>•</span>
                            <span>
                              Completed {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Progress Bar */}
                {(item.status === 'IMPORTING' || item.status === 'COMPLETED') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(getProgress(item))}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress(item)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {item.status === 'FAILED' && item.errorMessage && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{item.errorMessage}</p>
                  </div>
                )}

                {/* Success Summary */}
                {item.status === 'COMPLETED' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      Successfully imported {item.importedTracks} tracks
                      {item.playlist && (
                        <>
                          {' '}to{' '}
                          <a
                            href={`/dashboard/playlists/${item.playlist.id}`}
                            className="font-medium underline hover:no-underline"
                          >
                            {item.playlist.name}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}