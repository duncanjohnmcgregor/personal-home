import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifyService } from '@/lib/spotify'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = (searchParams.get('type') as 'track' | 'artist' | 'album' | 'playlist') || 'track'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Search on Spotify
    const searchResult = await SpotifyService.search(query, type, limit, offset)

    if (!searchResult) {
      return NextResponse.json(
        { error: 'Failed to search tracks on Spotify' },
        { status: 500 }
      )
    }

    return NextResponse.json(searchResult)
  } catch (error) {
    console.error('Error searching Spotify tracks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}