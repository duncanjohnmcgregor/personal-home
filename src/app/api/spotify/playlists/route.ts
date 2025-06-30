export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { SpotifyService } from '@/lib/spotify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // Fetch playlists from Spotify
    const playlists = await SpotifyService.getUserPlaylists(limit, offset)

    if (!playlists) {
      return NextResponse.json(
        { error: 'Failed to fetch playlists from Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(playlists)
  } catch (error) {
    console.error('Error fetching Spotify playlists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}