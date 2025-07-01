import { NextRequest, NextResponse } from 'next/server'
import { SpotifyService } from '@/lib/spotify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Song } from '@/types'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // Fetch playlist tracks from Spotify
    const tracks = await SpotifyService.getPlaylistTracks(id, limit, offset)

    if (!tracks) {
      return NextResponse.json(
        { error: 'Failed to fetch playlist tracks from Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Error fetching Spotify playlist tracks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { uris, position } = body

    if (!uris || !Array.isArray(uris) || uris.length === 0) {
      return NextResponse.json({ error: 'Track URIs are required' }, { status: 400 })
    }

    // Add tracks to playlist on Spotify
    const result = await SpotifyService.addTracksToPlaylist(id, { uris, position })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to add tracks to playlist on Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adding tracks to Spotify playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { uris } = body

    if (!uris || !Array.isArray(uris) || uris.length === 0) {
      return NextResponse.json({ error: 'Track URIs are required' }, { status: 400 })
    }

    // Remove tracks from playlist on Spotify
    const result = await SpotifyService.removeTracksFromPlaylist(id, uris)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to remove tracks from playlist on Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error removing tracks from Spotify playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}