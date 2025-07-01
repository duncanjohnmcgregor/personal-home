import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifySyncService } from '@/lib/sync'
import { prisma } from '@/lib/prisma'
import { SpotifyService } from '@/lib/spotify'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      playlistIds,
      createIfNotExists = true,
      updateExisting = true,
      handleConflicts = true
    } = body

    if (!playlistIds || !Array.isArray(playlistIds) || playlistIds.length === 0) {
      return NextResponse.json({ error: 'Playlist IDs array is required' }, { status: 400 })
    }

    // Limit batch size to prevent timeout
    if (playlistIds.length > 10) {
      return NextResponse.json({ 
        error: 'Batch size too large. Maximum 10 playlists per batch.' 
      }, { status: 400 })
    }

    // Start the batch sync process
    const result = await SpotifySyncService.batchSyncPlaylists(
      playlistIds,
      session.user.id,
      {
        createIfNotExists,
        updateExisting,
        handleConflicts
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error batch syncing playlists to Spotify:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}