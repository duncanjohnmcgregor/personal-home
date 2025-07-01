'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSync, useSyncStatus } from '@/lib/hooks/use-sync'
import { SyncStatus, Platform } from '@prisma/client'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react'

interface SyncButtonProps {
  playlistId: string
  playlistName?: string
  platform?: Platform
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function SyncButton({
  playlistId,
  playlistName = 'Playlist',
  platform = Platform.SPOTIFY,
  variant = 'default',
  size = 'default',
  className
}: SyncButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { syncPlaylist, isLoading, error } = useSync()
  const { status, refreshStatus } = useSyncStatus(playlistId, platform)

  const handleSync = async () => {
    const result = await syncPlaylist(playlistId, {
      createIfNotExists: true,
      updateExisting: true,
      handleConflicts: true
    })

    if (result) {
      setTimeout(() => refreshStatus(), 1000)
      setIsDialogOpen(true)
    }
  }

  const getSyncStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }

    switch (status?.status) {
      case SyncStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case SyncStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />
      case SyncStatus.PARTIAL:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case SyncStatus.IN_PROGRESS:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case SyncStatus.PENDING:
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <RefreshCw className="h-4 w-4" />
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isLoading || status?.status === SyncStatus.IN_PROGRESS}
      className={`flex items-center gap-2 ${className}`}
    >
      {getSyncStatusIcon()}
      {platform === Platform.SPOTIFY ? 'Sync to Spotify' : `Sync to ${platform}`}
    </Button>
  )
}