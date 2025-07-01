'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useSyncStatus } from '@/lib/hooks/use-sync'
import { SyncStatus, Platform } from '@prisma/client'
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2, Music } from 'lucide-react'

interface SyncStatusProps {
  playlistId: string
  platform?: Platform
  autoRefresh?: boolean
  refreshInterval?: number
}

export function SyncStatusDisplay({
  playlistId,
  platform = Platform.SPOTIFY,
  autoRefresh = true,
  refreshInterval = 5000
}: SyncStatusProps) {
  const { status, isLoading, error, refreshStatus, startPolling, stopPolling } = useSyncStatus(playlistId, platform)

  useEffect(() => {
    if (autoRefresh && status?.status === SyncStatus.IN_PROGRESS) {
      startPolling(refreshInterval)
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [status?.status, autoRefresh, refreshInterval, startPolling, stopPolling])

  const getSyncStatusIcon = () => {
    switch (status?.status) {
      case SyncStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case SyncStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />
      case SyncStatus.PARTIAL:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case SyncStatus.IN_PROGRESS:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case SyncStatus.PENDING:
        return <Clock className="h-5 w-5 text-gray-500" />
      default:
        return <Music className="h-5 w-5 text-gray-400" />
    }
  }

  const getSyncStatusText = () => {
    switch (status?.status) {
      case SyncStatus.COMPLETED:
        return 'Sync Completed'
      case SyncStatus.FAILED:
        return 'Sync Failed'
      case SyncStatus.PARTIAL:
        return 'Sync Completed with Issues'
      case SyncStatus.IN_PROGRESS:
        return 'Syncing in Progress'
      case SyncStatus.PENDING:
        return 'Sync Pending'
      case 'not_synced':
        return 'Not Synced'
      default:
        return 'Unknown Status'
    }
  }

  const getSyncStatusColor = () => {
    switch (status?.status) {
      case SyncStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200'
      case SyncStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200'
      case SyncStatus.PARTIAL:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case SyncStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case SyncStatus.PENDING:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProgressPercentage = () => {
    if (!status?.stats) return 0
    const { total, success, conflicts } = status.stats
    if (total === 0) return 0
    return Math.round(((success + conflicts) / total) * 100)
  }

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading sync status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Error loading sync status: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status || status.status === 'not_synced') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Music className="h-5 w-5" />
            <span>This playlist has not been synced yet</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSyncStatusIcon()}
          Sync Status
        </CardTitle>
        <CardDescription>
          {platform} synchronization details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant="outline" className={getSyncStatusColor()}>
            {getSyncStatusText()}
          </Badge>
        </div>

        {status.stats && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progress:</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {status.stats.success}
                </div>
                <div className="text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {status.stats.conflicts}
                </div>
                <div className="text-gray-600">Conflicts</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-600">
                  {status.stats.total}
                </div>
                <div className="text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}

        {status.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{status.errorMessage}</p>
          </div>
        )}

        {status.lastSyncAt && (
          <div className="text-xs text-gray-500">
            Last synced: {new Date(status.lastSyncAt).toLocaleString()}
          </div>
        )}

        {status.externalId && (
          <div className="text-xs text-gray-500">
            {platform} ID: {status.externalId}
          </div>
        )}
      </CardContent>
    </Card>
  )
}