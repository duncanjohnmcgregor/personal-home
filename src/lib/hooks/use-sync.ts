import { useState, useCallback } from 'react'
import { SyncResult, BatchSyncResult } from '@/lib/sync'
import { SyncStatus, Platform } from '@prisma/client'

interface SyncOptions {
  createIfNotExists?: boolean
  updateExisting?: boolean
  handleConflicts?: boolean
}

interface SyncStatusResponse {
  id?: string
  playlistId: string
  platform: Platform
  externalId?: string | null
  status: SyncStatus | 'not_synced'
  lastSyncAt?: Date | null
  errorMessage?: string | null
  stats?: {
    total: number
    success: number
    conflicts: number
  }
  recentLogs?: Array<{
    id: string
    action: string
    status: SyncStatus
    errorMessage?: string | null
    spotifyUri?: string | null
    createdAt: Date
  }>
  message?: string
}

export function useSync() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Sync a single playlist to Spotify
   */
  const syncPlaylist = useCallback(async (
    playlistId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sync/spotify/playlist/${playlistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to sync playlist')
      }

      const result: SyncResult = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error syncing playlist:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get sync status for a playlist
   */
  const getSyncStatus = useCallback(async (
    playlistId: string,
    platform: Platform = Platform.SPOTIFY
  ): Promise<SyncStatusResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/sync/spotify/status/${playlistId}?platform=${platform}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to get sync status')
      }

      const status: SyncStatusResponse = await response.json()
      return status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error getting sync status:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Batch sync multiple playlists
   */
  const batchSyncPlaylists = useCallback(async (
    playlistIds: string[],
    options: SyncOptions = {}
  ): Promise<BatchSyncResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sync/spotify/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlistIds,
          ...options,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to batch sync playlists')
      }

      const result: BatchSyncResult = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error batch syncing playlists:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Clear any existing error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    syncPlaylist,
    getSyncStatus,
    batchSyncPlaylists,
    clearError,
  }
}

/**
 * Hook for managing sync status polling
 */
export function useSyncStatus(playlistId: string, platform: Platform = Platform.SPOTIFY) {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const { getSyncStatus, isLoading, error } = useSync()

  const startPolling = useCallback(async (intervalMs: number = 2000) => {
    if (isPolling) return

    setIsPolling(true)
    
    const poll = async () => {
      const result = await getSyncStatus(playlistId, platform)
      if (result) {
        setStatus(result)
        
        // Stop polling if sync is complete or failed
        if (result.status === SyncStatus.COMPLETED || 
            result.status === SyncStatus.FAILED ||
            result.status === 'not_synced') {
          setIsPolling(false)
          return
        }
      }
      
      if (isPolling) {
        setTimeout(poll, intervalMs)
      }
    }

    await poll()
  }, [playlistId, platform, getSyncStatus, isPolling])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
  }, [])

  const refreshStatus = useCallback(async () => {
    const result = await getSyncStatus(playlistId, platform)
    if (result) {
      setStatus(result)
    }
    return result
  }, [playlistId, platform, getSyncStatus])

  return {
    status,
    isPolling,
    isLoading,
    error,
    startPolling,
    stopPolling,
    refreshStatus,
  }
}