import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifySyncService } from '@/lib/sync'
import { prisma } from '@/lib/prisma'
import { SpotifyService } from '@/lib/spotify'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function POST(
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

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const {
      createIfNotExists = true,
      updateExisting = true,
      handleConflicts = true
    } = body

    // Start the sync process
    const result = await SpotifySyncService.syncPlaylistToSpotify(
      playlistId,
      session.user.id,
      {
        createIfNotExists,
        updateExisting,
        handleConflicts
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error syncing playlist to Spotify:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}