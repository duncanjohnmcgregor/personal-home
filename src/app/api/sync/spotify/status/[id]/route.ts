import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifySyncService } from '@/lib/sync'
import { Platform } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: playlistId } = params
    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as Platform || Platform.SPOTIFY

    // Get sync status
    const syncStatus = await SpotifySyncService.getSyncStatus(playlistId, platform)

    if (!syncStatus) {
      return NextResponse.json({
        status: 'not_synced',
        message: 'Playlist has not been synced yet'
      })
    }

    return NextResponse.json({
      id: syncStatus.id,
      playlistId: syncStatus.playlistId,
      platform: syncStatus.platform,
      externalId: syncStatus.externalId,
      status: syncStatus.status,
      lastSyncAt: syncStatus.lastSyncAt,
      errorMessage: syncStatus.errorMessage,
      stats: {
        total: syncStatus.totalCount,
        success: syncStatus.successCount,
        conflicts: syncStatus.conflictCount
      },
      recentLogs: syncStatus.syncLogs?.map(log => ({
        id: log.id,
        action: log.action,
        status: log.status,
        errorMessage: log.errorMessage,
        spotifyUri: log.spotifyUri,
        createdAt: log.createdAt
      })) || []
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}