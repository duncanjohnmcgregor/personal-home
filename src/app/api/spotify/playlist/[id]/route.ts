import { NextRequest, NextResponse } from 'next/server'
import { SpotifyService } from '@/lib/spotify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Fetch playlist from Spotify
    const playlist = await SpotifyService.getPlaylist(id)

    if (!playlist) {
      return NextResponse.json(
        { error: 'Failed to fetch playlist from Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error fetching Spotify playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { name, description, public: isPublic, collaborative } = body

    if (!name) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 })
    }

    // Update playlist on Spotify
    const success = await SpotifyService.updatePlaylist(id, {
      name,
      description,
      public: isPublic,
      collaborative,
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update playlist on Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating Spotify playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}