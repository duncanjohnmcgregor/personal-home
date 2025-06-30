import { NextRequest, NextResponse } from 'next/server'
import { SpotifyService } from '@/lib/spotify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, description, public: isPublic, collaborative } = body

    if (!name) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 })
    }

    // Get Spotify user ID
    const spotifyUser = await SpotifyService.getCurrentUser()
    if (!spotifyUser) {
      return NextResponse.json(
        { error: 'Failed to get Spotify user information' },
        { status: 500 }
      )
    }

    // Create playlist on Spotify
    const playlist = await SpotifyService.createPlaylist(spotifyUser.id, {
      name,
      description,
      public: isPublic,
      collaborative,
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Failed to create playlist on Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error creating Spotify playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}